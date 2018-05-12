소투스 익스플로러! - 소투스 익스플로러에서 트랜잭션 보기 
=============
### 필자는 Window10 / docker 18.03.0-ce-win59 버전을 사용 하였습니다.

익스플로러를 설치 했으면 이제 소투스 프로그램을 실행시키고 트랜잭션 흐름을 봅시다! 
XO 게임 (틱택토) 를 사용해서 볼 것입니다. XO게임은 다음 링크를 참조하세요.
[XO게임 다운로드와 명령어 설명](./sawtooth/sawtooth running #2/XO Transaction Family.md)



**이때 모든 컨테이너가 제대로 설치되지 않는다면**

> $Env:COMPOSE_CONVERT_WINDOWS_PATHS=1

를 입력하신 뒤 
> docker-compose down 

위 명령어는 컨테이너를 삭제하는 명령어입니다. 
> docker-compose up -d

를 순서대로 입력하시면 오류 없이 실행될 것입니다. 
또한, Ctrl + c 를 통해서 언제든 실행 중인 컨테이너를 멈출 수 있습니다!


제대로 설치되었다면, 다음 그림과 같이 나와야 합니다. 

![성공](./img/yml.PNG)

하나라도 error 가 나면 제대로 되지 않은 것입니다.

또한 Kitematic을 통해서 설치된 컨테이너를 봤을 때, 다음과 같아야 합니다.



![성공2](./img/kitematic.PNG)


세 가지의 컨테이너가 정상적으로 설치되어야 합니다.

다음으로, 

> http://localhost:4200/ 

로 접속해 보세요. 

![성공3](./img/explorer.PNG)

이 화면이 뜬다면 제대로 깔린 것입니다. 


다음 편은 블록체인을 실행시키고 트랜잭션을 보는 방법을 알려드립니다. 

[다음편](./Sawtooth-explorer2.md)
