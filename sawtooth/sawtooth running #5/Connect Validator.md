유징 소투스 윗 도커 뽀 윈도우
====
`이 문서는 hyperledger sawtooth 1.0을 docker for windows(18.03.01-ce-win65)에서 다루며 os는 window 10 pro임`

# 5. Connect multi validator in local server

## 1. Overview
이번 문서에서는 여태까지 단일 validator에서 진행하던 sawtooth network를 키워서 멀-티 validator를 만들어보도록 하겠습니다! 로컬환경에서 진행하겠습니다. 다른 네트워크상에서 이어보는건 다음문서에서!

## 2. Prerequisites

공식 doc에서는 validator를 4개를 사용하여 연결되는 것을 보여주고있습니다.  
--> [참고링크](https://sawtooth.hyperledger.org/docs/core/nightly/master/app_developers_guide/sawtooth-default-poet.yaml)

이 문서에서는 보다 간편하게 설명하기 위해서 validator 2개만 가지고 설명할것임.

## 3. 소스코드 뜯

### XoTransactionProcessor.java

프로그램의 시작점입니다.
~~~java
public class XoTransactionProcessor {
  /**
   * TransactionProcessor가 들어있는 Thread를 실행
   */
  public static void main(String[] args) {
    /*
    * args[0]에 들어가야할 것 
    * tcp://validator의ip또는 docker의 ip:4004
    */
    TransactionProcessor transactionProcessor = new TransactionProcessor(args[0]);
    transactionProcessor.addHandler(new XoHandler());
    Thread thread = new Thread(transactionProcessor);
    thread.start();
  }
}
~~~
`TransactionProcessor`에서는 validator의 ip나 docker의 ip를 받아 포트 4004로 sawtooth와 연결.  
핸들러로 XoHandler를 추가, 그다음 thread로 실행시킵니다.  

### XoHandler.java

`TransactionHandler`를 implements하여 API를 오버라이드하여 다양한 메소드를 활용할 수 있습니다.

~~~java
- XoHandler
 public XoHandler() {
    try {
      this.xoNameSpace = Utils.hash512(
        this.transactionFamilyName().getBytes("UTF-8")).substring(0, 6);
    } catch (UnsupportedEncodingException usee) {
      usee.printStackTrace();
      this.xoNameSpace = "";
    }
  }

  @Override
  public String transactionFamilyName() {
      /*transaction의 family name을 리턴*/
    return "xo";
  }

  @Override
  public String getVersion() {
      /*현재 버전 리턴*/
    return "1.0";
  }

  @Override
  public Collection<String> getNameSpaces() {
    ArrayList<String> namespaces = new ArrayList<>();
    namespaces.add(this.xoNameSpace);
    return namespaces;
  }

~~~

---

사용할 TransactionData와 GameData를 구성
~~~java
  class TransactionData {
    final String gameName;
    final String action;
    final String space;

    TransactionData(String gameName, String action, String space) {
      this.gameName = gameName;
      this.action = action;
      this.space = space;
    }
  }

  class GameData {
    final String gameName;
    final String board;
    final String state;
    final String playerOne;
    final String playerTwo;

    GameData(String gameName, String board, String state, String playerOne, String playerTwo) {
      this.gameName = gameName;
      this.board = board;
      this.state = state;
      this.playerOne = playerOne;
      this.playerTwo = playerTwo;
    }
  }
~~~

---

~~~java
  - apply메소드
  /*
  * apply메소드는 두개의 argument를 받습니다.
  * transactionRequest : 실행된 커맨드를 받습니다. (예: take space, create game)
  * stateStore : 게임의 현재상태를 저장한 상태정보
  * */
  @Override
  public void apply(TpProcessRequest transactionRequest, State stateStore)
      throws InvalidTransactionException, InternalError {

    //리퀘스트 데이터를 unpack해서 transactionData에 저장
    TransactionData transactionData = getUnpackedTransaction(transactionRequest);

    // transaction의 서명자는 플레이어
    String player;
    TransactionHeader header = transactionRequest.getHeader();
    player = header.getSignerPublicKey();

    /*이 밑으로는 처음 트랜잭션을 받았을 때 처리해야할 exception들을 정의해둠*/
    if (transactionData.gameName.equals("")) { //게임이름이 빠진경우
      throw new InvalidTransactionException("Name is required");
    }
    if (transactionData.gameName.contains("|")) {//게임이름의 특수경우
      throw new InvalidTransactionException("Game name cannot contain '|'");
    }
    if (transactionData.action.equals("")) {//액션이빠짐
      throw new InvalidTransactionException("Action is required");
    }
    if (transactionData.action.equals("take")) {//take 커맨드 사용
      try {
        int space = Integer.parseInt(transactionData.space); //마킹할 장소(space)

        if (space < 1 || space > 9) {//마킹할 장소는 1~9사이여야함
          throw new InvalidTransactionException(
              String.format("Invalid space: %s", transactionData.space));
        }
      } catch (NumberFormatException e) {
        throw new InvalidTransactionException("Space could not be converted to an integer.");
      }
    }
    /*커맨드가 take와 create가 아닌 경우*/
    if (!transactionData.action.equals("take") && !transactionData.action.equals("create")) {
      throw new InvalidTransactionException(
          String.format("Invalid action: %s", transactionData.action));
    }

    String address = makeGameAddress(transactionData.gameName);
    // stateStore.get() returns a list.
    // If no data has been stored yet at the given address, it will be empty.
    // 현재상태의 주소값을 가져옴. singletonList: 생성후 변경불가능한객체
    String stateEntry = stateStore
            .getState(Collections.singletonList(address))//만든 게임의 상태
            .get(address) //그 상태의 주소
            .toStringUtf8();
    
    //현재 게임의 상태를 stateData에 저장
    GameData stateData = getStateData(stateEntry, transactionData.gameName);
    
    //상태데이터와 커맨드데이터, 누가(주체)플레이중인지 로 업데이트된 게임데이터
    GameData updatedGameData = playXo(transactionData, stateData, player);
    
    //저-장 (게임의주소, 업데이트된 게임데이터, 현재게임상태 주소, 현재게임상태)
    storeGameData(address, updatedGameData, stateEntry, stateStore);
  }
~~~

---

나머지 메소드는 생략

---

<img width="100" height="100" src="./img/p.png"></img>