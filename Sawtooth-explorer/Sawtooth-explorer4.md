다른 서버와 연결하기 위해서 설정을 수정하는 방법을 알아 보겠습니다. 

docker -> nginx.conf 로 들어가서,
proxy_pass          http://연결하려는 서버의 주소:8008; 
로 수정해 주세요. 

다음으로, 
src -> environments -> environment.ts 로 들어가서
apiURL: 'http://연결하려는 서버의 주소:8090',

로 수정해 주세요~! 
소투스 API 프록시가 8090으로 접근하기 때문에, 
tcping 으로 포트가 열려 있는지 확인하세요. 닫혀 있다면 저 설정을 바꿔도 연결할 수 없습니다. 