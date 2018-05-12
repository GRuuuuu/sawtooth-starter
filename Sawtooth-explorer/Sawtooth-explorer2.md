소투스 익스플로러! - 소투스 익스플로러에서 트랜잭션 보기 
=============
### 필자는 Window10 / docker 18.03.0-ce-win59 버전을 사용 하였습니다.

익스플로러를 설치 했으면 이제 소투스 프로그램을 실행시키고 트랜잭션 흐름을 봅시다! 
XO 게임 (틱택토) 를 사용해서 볼 것입니다. XO게임은 다음 링크를 참조하세요.

[XO게임 다운로드와 명령어 설명](https://github.com/GRuuuuu/Learning_Sawtooth/blob/master/sawtooth/sawtooth%20running%20%232/XO%20Transaction%20Family.md)

[Yaml파일은 여기](https://sawtooth.hyperledger.org/docs/core/releases/1.0/app_developers_guide/sawtooth-default.yaml)

~~~
% docker-compose -f sawtooth-default.yaml up
~~~

Yaml 파일이 있는 곳에서 파워쉘을 열어 주시고 위 명령어를 입력하세요.
**그리고 소투스 익스플로러를 켜 주세요.**
아마 트랜잭션이 보일 것입니다. 그냥 연결된 것이니 계속 진행합니다. 
다음으로 Bash로 들어갑니다. 

~~~
% docker exec -it sawtooth-shell-default bash
~~~

이어서 링크에 나와 있듯이 keygen 명령어를 쳐 주시면 됩니다. 다음으로,

~~~
xo create {Game name} --username jack --url http://rest-api:8008 
~~~

를 입력해 주세요, {} 부분에는 게임이름을 입력하시면 됩니다.
여기까지 하고 익스플로러를 켜 보세요.

![트랜잭션](./img/transacion.PNG)

바로 이렇게 트랜잭션 정보가 보입니다. 

이어서, 

~~~
$ xo take game 5 --username jack --url http://rest-api:8008
~~~
~~~
$ xo take game 1 --username jill --url http://rest-api:8008
~~~

두 개를 입력할 때마다 새로운 트랜잭션이 생겨날 것입니다. 

![트랜잭션2](./img/transacion2.PNG)

서로 번갈아서 한 번씩 마킹한 뒤의 트랜잭션 뷰입니다. 

또한, 만약에 자기 차례가 아닌데 마킹을 시도했다면, 트랜잭션이 아예 발생되지 않는 것을 알 수 있습니다. 

다음 편은 다른 서버상에 있는 소투스 API에 익스플로러를 연결시키는 방법을 알려드립니다. 
(~~생각해 보니까 다른 서버에 막 연결 가능하면 당연히 안 될 것 같지만 해 보겠습니다.~~)

[다음편](./Sawtooth-explorer3.md)
