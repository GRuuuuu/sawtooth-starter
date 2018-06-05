FROM anapsix/alpine-java
MAINTAINER new-xoGAME:1.0
COPY new-xoGAME.jar /home/new-xoGAME.jar
CMD ["java","-cp","/home/new-xoGAME.jar","src.sawtooth.examples.xo.XoTransactionProcessor","tcp://validator-0:4004"]