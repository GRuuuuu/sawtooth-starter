# Global State

sawtooth와 같은 분산원장에서의 목표는 참가하고 있는 모든 노드들이 분산된 원장을 갖게 하는것입니다. 데이터를 각 노드들이 일관되게 복사해서 갖고 있는것을 보장하는것은 블록체인 기술에서 가장 중요한 강점이라고 할 수 있습니다.  

sawtooth는 각 validator위에 있는 Merkle-Radix tree(머클트리)의 단일 인스턴스 속 모든 트랜잭션 패밀리의 상태를 보여줍니다. 각 validator에서 일어나는 블록검증 프로세스는 동일한 상태의 트랜잭션은 같은 상태로의 전이를 나타내고 결과 데이터가 네트워크의 모든 참가자에게 동일하게 적용되도록 합니다.  

상태는 트랜잭션 패밀리의 작성자(author)가 트랜잭션 프로세서 간의 전역 상태 데이터를 정의, 공유 및 재사용 할 수 있는 유연성을 허용하는 namespace로 나뉩니다.  


# Merkle-Radix Tree Overview

## Merkle Hashes

sawtooth는 머클트리를 트랜잭션 패밀리의 데이터를 저장하는데 사용합니다.  
자세하게 살펴봅시당: 머클트리는 리프에서 루트방향으로 성공적으로 해시된 노드를 복사해서 붙여넣는 구조입니다. 블록과 관련된 상태전이가 주어진다면 현재 버전의 트리에서 단일루트의 해시를 생성할 수 있습니다. 블록헤더에 상태루트 해시를 위치시킴으로써, 블록체인에 대한 합의 외에도 예상되는 상태 버전에 대한 합의를 얻을 수 있습니다. 다른 해시로부터 일어난 validator 상태 전이의 블록은 유효하지 않다고 여기게 됩니다. 더 많은 정보는 Wikipedia의 [Merkle](https://en.wikipedia.org/wiki/Merkle_tree)을 참고하세요.  
![Alt text](https://sawtooth.hyperledger.org/docs/core/nightly/master/_images/state_merkle_hashes.svg)


>상태루트의 해시값은 모든 데이터와 자식 해시들이 가리키는 모든 노드들의 누적값입니다. 그래서 만약 트리 안에서 데이터의 변경이 발생하면 연관된 모든 해시값들이 변경되게 됩니다.  

## Radix Addresses
![Alt text](https://sawtooth.hyperledger.org/docs/core/nightly/master/_images/state_address_format.svg)
Radix트리는 트리의 리프노드에 대한 경로를 고유하게 식별할 수 있습니다. 주소는 hex인코딩된 70개의 문자로 나타나집니다. 길이는 35bytes(Namespace prefix: 3bytes, Namespace-specific: 32bytes). 각 바이트는 주소와 연관된 데이터가 들어있는 리프 경로의 다음 노드를 식별하는 Radix path입니다. 주소는 앞 3bytes(6 hex characters)를 namespace의 prefix로 사용합니다. sawtooth에서는 2^24(16,777,216)개의 서로다른 namespace를 사용할 수 있습니다. 남은 32bytes(64 hex characters)는 namespace를 디자인한 사람이 정의한 인코딩방식으로 인코딩됩니다. 그리고 추가적으로 object 타입을 구별하고 도메인 별 고유 식별자를 주소에 매핑하는것들이 추가될 수 있습니다. 더 자세한 설명은 Wikipedia의 [Radix](https://en.wikipedia.org/wiki/Radix_tree)를 참조!

![Alt text](https://sawtooth.hyperledger.org/docs/core/nightly/master/_images/state_radix.svg)

>간단한 머클트리 설명 ->  
>블록의 헤더는
> 1. previous 블록의 해시값(연결되어있음을 나타냄) 
> 2. nonce값
> 3. 머클 루트 (Merkle Root)  
>로 구성되어있으며 머클 루트는 해당 블록의 모든 거래내역을 요약한 작은 사이즈의 용량의 데이터를 담고있다.  
>머클 트리는 이진트리의 구성으로 이루어져있고 각 자식노드 두개를 합한게 부모노드가 된다. 즉 머클트리의 루트는 모든 노드의 해시값을 요약한 값이라는 것.  
>트랜잭션이 몇개가 되든 머클트리의 루트의 용량은 32byte로 항상 같다.  
>또한 트랜잭션이 위조되면 루트의 해시값도 바뀌게 되므로 머클트리의 경로를 따라가면 거래의 위변조도 알 수 있게되며 이를 방지할 수 있게 된다.

# Serialization Concerns

namespace의 디자이너는 주소의 인코딩 방식 외에도 주소를 저장하고 있는 데이터에 대해  serializing/deserializing 매커니즘을 정의해야합니다. domain-specific Transaction Processor는 validator가 기본적으로 제공하는 get set메소드를 가지고 있으며, get은 address를 byte배열로 리턴하고 set은 byte배열을 세팅할 수 있습니다. byte배열은 코어시스템에서는 그냥 봐서는 이해하기 힘들게 되어있습니다. namespace의 디자이너가 정의한 룰에 따라 deserialize를 해야 의미를 가진 데이터로 변하게 됩니다. 트랜잭션의 실행, 플랫폼 및 serialization 프레임워크의 여러 버전에서 serialization 스킴을 정하는 것은 매우 중요합니다. 순서화된 직렬화를 시행하지 않는 자료구조는 피해야합니다.(예: 집합, map, dicts) 요구되어지는 사항은 공간과 시간에 걸쳐서 byte배열을 일관되게 생성하는 것입니다. 동일한 byte배열이 생성되지 않는다면 데이터가 담겨있는 리프노드의 해시값이 다르다고 여겨지며 모든 부모노드가 루트로 돌아가게 됩니다. 이렇게 되면 몇몇개의 validator에서는 유효하다, 다른 validator에서는 블럭과 트랜잭션이 유효하지 않다 라는 결론이 나게 되므로 결정할수없는 문제에 봉착하게 됩니다.
