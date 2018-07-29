module.exports = function (app, fs) {

    app.get("/", function (req, res) {
        var sess = req.session;

        res.render("index", {
            title: "MY HOME",
            length: 5,
            name: sess.name,
            username: sess.username
        });
    });

    app.get("/d", function (req, res) {
        const cbor = require("cbor");
        const {createContext, CryptoFactory} = require("sawtooth-sdk/signing");
        const {Secp256k1PrivateKey} = require("sawtooth-sdk/signing/secp256k1");
        const {createHash} = require("crypto");
        const {Policy,IdentityPayload,TransactionHeader,
            Transaction,BatchHeader,Batch,BatchList} = require("../protobuf");
        const request = require("request");
        const crypto = require("crypto");


        const context = createContext("secp256k1"); //암호화 컨텍스트
        //const privateKey = context.newRandomPrivateKey(); //

        //const priv=Buffer.from("6ebacf7c3e6addf1945ae982e6a180cf8dd74c8e0f8ea0a4c9fff77a4db69f80","hex");
        //const privateKey=Secp256k1PrivateKey(priv);
        const privateKey = Secp256k1PrivateKey.fromHex("8a0d61af0a9518bcf4d60f013edc5da6876fcd4dad9ee0f3a832a0c67122faae");
        const signer = new CryptoFactory(context).newSigner(privateKey);

        // Here's how you can generate the input output address
        const FAMILY_NAMESPACE = crypto.createHash("sha512").update("sawtooth_identity").digest("hex").toLowerCase().substr(0, 6);

        const policyBytes = Policy.encode({
            name: "p1_name",
            entries: [
                {
                    type: 1,
                    key: "*"
                }
            ]
        }).finish();

        const payloadBytes = IdentityPayload.encode({
            type : 1,
            data : policyBytes
        }).finish();


        const transactionHeaderBytes = TransactionHeader.encode({
            familyName: "sawtooth_identity",
            familyVersion: "1.0",
            inputs: ["000000", "00001d"],
            outputs: ["00001d"],
            test: signer.getPublicKey(),
            signerPublicKey: signer.getPublicKey(privateKey).asHex(),
            // In this example, we're signing the batch with the same private key,
            // but the batch can be signed by another party, in which case, the
            // public key will need to be associated with that key.
            batcherPublicKey: signer.getPublicKey(privateKey).asHex(),
            // In this example, there are no dependencies.  This list should include
            // an previous transaction header signatures that must be applied for
            // this transaction to successfully commit.
            // For example,
            // dependencies: ['540a6803971d1880ec73a96cb97815a95d374cbad5d865925e5aa0432fcf1931539afe10310c122c5eaae15df61236079abbf4f258889359c4d175516934484a'],
            dependencies: [],
            payloadSha512: createHash("sha512").update(payloadBytes).digest("hex")
        }).finish();

        const signature = signer.sign(transactionHeaderBytes);

        const transaction = Transaction.create({
            header: transactionHeaderBytes,
            headerSignature: signature,
            payload: payloadBytes
        });
        const transactions = [transaction];

        const batchHeaderBytes = BatchHeader.encode({
            signerPublicKey: signer.getPublicKey().asHex(),
            transactionIds: transactions.map((txn) => txn.headerSignature),
        }).finish();

        const signature2 = signer.sign(batchHeaderBytes);

        const batch = Batch.create({
            header: batchHeaderBytes,
            headerSignature: signature2,
            transactions: transactions
        });
        const batchListBytes =BatchList.encode({
            batches: [batch]
        }).finish();

        request.post({
            url: "http://localhost:8008/batches",
            body: batchListBytes,
            headers: {"Content-Type": "application/octet-stream"}
        }, (err, response) => {
            if (err) {
                return console.log(err);
            }

            console.log(response.body);
        });
    });
};
