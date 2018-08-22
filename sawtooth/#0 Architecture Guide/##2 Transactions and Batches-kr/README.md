# Transactions and Batches

트랜잭션을 생성하고 적용하게되면 상태가 변하게 됩니다. 클라이언트는 트랜잭션을 만들고 validator에 보내고 validator는 그 트랜잭션을 적용시키는데, 이것이 상태를 변하게 만듭니다.  

트랜잭션은 batch에 쌓여있습니다. batch안에 있는 모든 트랜잭션들은 한번에 상태에 커밋되거나 또는 한번에 거절됩니다. 따라서, batches는 상태변화에 있어서 atomic한 유닛이라고 볼 수 있습니다.  

batches의 구조와 트랜잭션을 포함한 batch, BatchHeader, Transaction, TransactionHeader의 개략도 입니다.

![Alt text](https://sawtooth.hyperledger.org/docs/core/nightly/master/_images/arch_batch_and_transaction.svg)  


# Transaction Data Structure

트랜잭션은 Protocol Buffer를 사용해 serialize됩니다. 두개의 메세지 타입으로 구성됩니다:  

File: protos/transaction.proto
~~~proto
// Copyright 2016 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

syntax = "proto3";

option java_multiple_files = true;
option java_package = "sawtooth.sdk.protobuf";
option go_package = "transaction_pb2";

message TransactionHeader {
    // Public key for the client who added this transaction to a batch
    string batcher_public_key = 1;

    // A list of transaction signatures that describe the transactions that
    // must be processed before this transaction can be valid
    repeated string dependencies = 2;

    // The family name correlates to the transaction processor's family name
    // that this transaction can be processed on, for example 'intkey'
    string family_name = 3;

    // The family version correlates to the transaction processor's family
    // version that this transaction can be processed on, for example "1.0"
    string family_version = 4;

    // A list of addresses that are given to the context manager and control
    // what addresses the transaction processor is allowed to read from.
    repeated string inputs = 5;

    // A random string that provides uniqueness for transactions with
    // otherwise identical fields.
    string nonce = 6;

    // A list of addresses that are given to the context manager and control
    // what addresses the transaction processor is allowed to write to.
    repeated string outputs = 7;

    //The sha512 hash of the encoded payload
    string payload_sha512 = 9;

    // Public key for the client that signed the TransactionHeader
    string signer_public_key = 10;
}

message Transaction {
    // The serialized version of the TransactionHeader
    bytes header = 1;

    // The signature derived from signing the header
    string header_signature = 2;

    // The payload is the encoded family specific information of the
    // transaction. Example cbor({'Verb': verb, 'Name': name,'Value': value})
    bytes payload = 3;
}

// A simple list of transactions that needs to be serialized before
// it can be transmitted to a batcher.
message TransactionList {
    repeated Transaction transactions = 1;
}
~~~

## Header, Signature, and Public Keys

트랜잭션의 헤더는 TransactionHeader의 serialize된 버전입니다. 헤더는 서명자의 개인키로 서명되며 그 결과는 header_signature에 저장됩니다. 헤더는 serialize된 폼으로 나타나지며 트랜잭션을 수신하였을 때 서명을 통해 정확한 바이트를 확인할 수 있습니다.   

검증과정은 header바이트를 서명자의 공개키로 서명한 결과가 header_signature로 나타나는지 확인합니다.  

batch의 공개키 필드는 그 batch가 담겨있는 트랜잭션의 서명과 일치해야합니다.  

serialize된 문서는 트랜잭터(트랜잭션을 보내는 쪽)의 (secp256k1로 암호화된)개인키로 서명됩니다.  

validator는 64바이트의 "작은"서명을 가지고 있습니다. 이것은 서명의 R과 S필드를 합친 것입니다. 몇몇 라이브러리는 추가적인 헤더바이트(복구 ID 또는 DER로 인코딩된 서명들)를 제공하기도 합니다. sawtooth는 64바이트를 넘는 모든 서명들을 거부합니다.  

>송신자에의해 구성된 원래의 헤더 데이터는 서명을 확인하는데 사용됩니다. 헤더(예: 파이썬객체)를 역직렬화하고 원본과 동일한 바이트 시퀀스를 생성하기 위해 재직렬화하는 것은 좋은 방법이 아닙니다. 직렬화는 프로그램 언어나 라이브러리에 크게 영향을 받기때문에 편차가 있으면 서명과 일치하지 않는 바이트 시퀀스가 생성됩니다: 따라서 검증을 위해서는 원본 헤더 바이트를 사용하는것이 가장 좋습니다.

## Transaction Family

Hyperledger sawtooth에서는 사용가능한 트랜잭션의 집합을 트랜잭션 패밀리라고 불리는 확장가능한 시스템으로 정의할 수 있습니다. 새로운 트랜잭션 패밀리를 정의하고 구현하는 것은 적용할 수 있는 트랜잭션의 분류체계를 추가하는 것과 같습니다.  
[Application Developer's Guide](https://sawtooth.hyperledger.org/docs/core/nightly/master/app_developers_guide.html)에서 소개한 나만의 트랜잭션 패밀리만들기에서 우리는 틱택토를 플레이할 수 있는 트랜잭션들의 집합을 xo라는 이름으로 트랜잭션 패밀리를 정의하였습니다.  

또한 트랜잭션 패밀리의 이름(family_name)외에도 각 트랜잭션은 패밀리의 버전(family_version)을 설정할 수 있습니다. 네트워크의 노드를 조정하는 동안 버전 문자열을 사용하여 트랜잭션 패밀리를 업그레이드할 수 있습니다.  

## Dependencies and Input/Output Address

트랜잭션은 다른 트랜잭션에 의존적일 수 있습니다. 즉 의존적인 트랜잭션은 그것이 의존하는 트랜잭션 이전에 적용될 수 없다.   

트랜잭션의 의존성필드를 사용하면 반드시 이전 트랜잭션에 적용되어야하는 트랜잭션들을 명확하게 지정할 수 있습니다. 명시적으로 정의된 의존성은 트랜잭션에 의존성이 있지만 동일한 batch에 배치할 수 없는 상황에서 유용합니다. 예를들어 다른시간에 제출된 트랜잭션들 같은 상황이 있을 수 있습니다.  

병렬 스케줄링을 지원하기 위해서 트랜잭션의 input과 output필드는 상태주소를 포함하고 있습니다. 스케줄러는 상태의 상호작용을 기반으로해서 트랜잭션간의 의존성을 묵시적으로 정합니다. 주소들은 정규화된 리프노드(fully qualified leaf-node)의 주소 또는 부분적인 접두사(partial prefix) 주소일 수 있습니다. input 주소는 상태로부터 값을 읽어들이고 output주소는 상태에 값을 쓰게할 수 있고 input과 output은 트랜잭션이 실행되는 동안 반드시 필요합니다. 부분적인 주소는 와일드카드처럼 작동하며 트랜잭션이 리프노드 대신에 트리의 일부를 지정할 수 있도록 허용합니다.

## Payload

상태에 적용시킬 변화를 담는 방법으로써 트랜잭션이 실행될 때 사용됩니다. 트랜잭션 패밀리는 트랜잭션을 처리할 때, 페이로드를 역직렬화(deserialize)하여 사용합니다.  

payload_sha512필드는 SHA-512로 해시된 페이로드 byte를 가지고 있습니다. 헤더의 한 부분으로써 payload_sha512는 서명되고 나중에 검증되지만 페이로드 필드는 그렇지 않습니다. 페이로드 필드를 검증하기 위해서 페이로드는 SHA-512로 해시된 후, payload_sha512와 비교하며 확인합니다.  

## Nonce

넌스 필드는 클라이언트에 의해 랜덤으로 생성된 문자열을 담고 있습니다. 만약 두개의 트랜잭션이 같은 필드를 담고 있다면 넌스값은 그들이 서로다른 헤더 시그니처를 생성한다는 것을 보장합니다.


# Batch Data Structure

batch는 protocol buffer를 사용해서 serialize됩니다. 두개의 메세지타입을 담고있습니다.

File: protos/batch.proto

~~~proto
// Copyright 2016 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

syntax = "proto3";

option java_multiple_files = true;
option java_package = "sawtooth.sdk.protobuf";
option go_package = "batch_pb2";

import "transaction.proto";

message BatchHeader {
    // Public key for the client that signed the BatchHeader
    string signer_public_key = 1;

    // List of transaction.header_signatures that match the order of
    // transactions required for the batch
    repeated string transaction_ids = 2;
}

message Batch {
    // The serialized version of the BatchHeader
    bytes header = 1;

    // The signature derived from signing the header
    string header_signature = 2;

    // A list of the transactions that match the list of
    // transaction_ids listed in the batch header
    repeated Transaction transactions = 3;

    // A debugging flag which indicates this batch should be traced through the
    // system, resulting in a higher level of debugging output.
    bool trace = 4;
}

message BatchList {
    repeated Batch batches = 1;
}
~~~


## Header, Signature, and Public Keys

트랜잭션에서 언급했던 패턴처럼 Batch의 헤더필드도 BatchHeader의 버전으로 seriallize됩니다. 헤더는 서명자의 개인키로 서명되며 그 결과는 header_signature에 저장됩니다. 헤더는 직렬화된 폼으로 존재하므로 batch 수신 시 서명에 대한 정확한 데이터를 확인할 수 있습니다.  

serialize된 문서는 트랜잭터의 secp256k1로 암호화된 개인 ECDSA키로 서명됩니다.  

validator는 64바이트의 "작은"서명 공간을 요구하고 이것은 R과 S필드가 붙어서 구성될 수 있습니다. 몇몇 라이브러리는 추가적인 헤더정보나 복구ID 또는 DER로 서명된 서명을 포함하고 있지만, sawtooth는 64바이트 이외의 서명은 전부 거부합니다.  

## Transactions

트랜잭션 필드에는 batch를 구성하는 트랜잭션 목록이 포함되어 있습니다. 트랜잭션들은 순서대로 적용됩니다. transaction_ids 필드는 트랜잭션 헤더의 서명의 리스트를 담고 있으며 트랜잭션의 필더와 같은 순서로 되어있습니다.  


# Why batches?  

위에서 언급했던 것처럼 batch는 시스템에서 atomic하게 움직이는 유닛입니다. batch가 한번 적용되면 batch안의 모든 트랜잭션들은 순서대로 적용되기 시작합니다. 만약 batch가 적용되지 않는다면 안에 담긴 트랜잭션들은 전부 거절됩니다.  

이렇게 하면 batch 내의 트랜잭션에 명시해야할 종속성이 필요하지 않으므로 클라이언트 관점에서 굉장히 간소화됩니다. 결과적으로, 명시적인 종속성(트랜잭션의 의존성필드와 같은)의 유용성은 트랜잭션들을 동일한 batch에 배치할 수 없는 종속성으로 제한됩니다.  

batch는 명시적인 종속성으로는 해결할 수 없는 문제를 해결할 수 있습니다. A, B, C의 순서로 3개의 트랜잭션이 존재한다고 가정해봅시다. 그리고 이 중 아무것이든 하나가 유효하지 않다면 전부가 적용되지 않습니다.  
종속성만을 이용해서 이 문제를 해결해본다고 했을때 우리는 트랜잭션간의 관계를 다음과 같이 표현할 수 있습니다.: C는 B에 의존, B는 A에 의존, A는 C에 의존. 하지만 종속성 필드는 이 관계를 나타낼 수 없습니다. 순서대로 트랜잭션이 시행되기 때문에 임의로 순서를 지정할 수는 없습니다.  

다수의 트랜잭션 패밀리의 트랜잭션은 하나의 batch로 묶일 수 있습니다. 트랜잭션 패밀리의 재사용을 장려하기 위함이죠.  

트랜잭션과 batch들은 다른 키로 서명될 수 있습니다. 예를들어, 브라우저 어플리케이션이 트랜잭션을 서명하고 서버사이드 컴포넌트가 트랜잭션을 추가하고 batch를 생성할때 따로 서명할  수 있습니다. 이것은 여러 트랜잭터들의 트랜잭션을 하나의 오퍼레이션으로 묶을수있게 하는 흥미로운 패턴을 가능하게 합니다.  

트랜잭션과 batch들 사이에 중요한 제한사항이 하나 더 있습니다. 트랜잭션은 반드시 batch 서명자의 공개키를 batcher_public_key 필드에 담고있어야합니다. 이것은 트랜잭션이 batch와 별도로 재사용 되지않도록 하기 위한 것입니다. 