# Architecture Guide

원문 : [sawtooth docs >> Architecture Guide](https://sawtooth.hyperledger.org/docs/core/nightly/master/architecture.html)

다음 디자인은 high-level에서 본 Sawtooth의 구조입니다.  

이 문서에서는 Hyperledger Sawtooth의 구조와 디자인에 대해서 다루고 있습니다.  

가장 중요한 개념인 global state와 sawtooth batches부터 시작하고 validator와 다른 코어항목에 대해서 볼 것입니다. journal이나 block management, consensus, transaction scheduling, permissioning 등등.

![Alt text](https://sawtooth.hyperledger.org/docs/core/nightly/master/_images/arch-sawtooth-overview.svg)
