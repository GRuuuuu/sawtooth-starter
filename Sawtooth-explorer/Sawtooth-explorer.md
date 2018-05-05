소투스 익스플로러!
=============
### 필자는 Window10 / docker 18.03.0-ce-win59 버전을 사용 하였습니다.

먼저 이곳에서 파일을 다운 받아주세요. 
> <https://github.com/hyperledger/sawtooth-explorer>

다운로드를 하신 뒤 압축을 푸시고 
그 폴더에 들어가신 뒤, Shift + 마우스 우클릭을 통해서 파워쉘을 열어주세요. 
다음 명령어를 입력하셔서 도커에 컨테이너를 설치합니다. 
> docker-compose up

__이때 모든 컨테이너가 제대로 설치되지 않는다면 __
> $Env:COMPOSE_CONVERT_WINDOWS_PATHS=1

를 입력하신 뒤 

> docker-compose down 
> docker-compose up -d

를 순서대로 입력하시면 오류 없이 실행될 것입니다. 
Ctrl + c 를 통해서 언제든 실행 중인 컨테이너를 멈출 수 있습니다. 
