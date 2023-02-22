import dotenv from "dotenv";
import path from "path";
import { task } from "hardhat/config";
import { restore } from "firestore-export-import";
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
import { admin, serviceAccount } from "../../lib/firebase";
import fs from "fs";
import { getCurrentEpochTimestamp } from "../../utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

const jsonToFirestore = async () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    console.log("Firebase Initialized");

    await restore(path.resolve(__dirname, "./output/proofs.json"));
    console.log("Upload Success");
  } catch (error) {
    console.log(error);
  }
};

const writeToFile = (array: any, filename: string) => {
  fs.writeFileSync(
    path.resolve(__dirname, `./output/${filename}`),
    JSON.stringify(array)
  );
};

task("generate-merkle-tree", "").setAction(async (_, { network, ethers }) => {
  const rewardFilepath = path.resolve(
    __dirname,
    "../getBribeRewardsAllUsers/output/rewards.json"
  );
  const rewardData = JSON.parse(fs.readFileSync(rewardFilepath).toString());

  const keys = Object.keys(rewardData);

  const leaves = keys.map((key: string, index: number) => {
    const reward = rewardData[key];
    const tokenKeys = Object.keys(reward);

    return [tokenKeys, tokenKeys.map((key: string) => reward[key]), key];
  });

  const tree = StandardMerkleTree.of(leaves, [
    "address[]",
    "uint256[]",
    "address",
  ]);

  const root = tree.root;

  console.log("root hash of the tree is :", root);

  let proofs: any = {};
  leaves.forEach((leaf: any, index: number) => {
    let proof;
    for (const [i, v] of tree.entries()) {
      if (v[2] === leaf[2]) {
        proof = tree.getProof(index);
        proofs[v[2] as string] = {
          proof: proof,
          rewardInfo: {
            tokens: v[0],
            amounts: v[1],
          },
        };
        break;
      }
    }
  });

  proofs["root"] = { proof: root };

  writeToFile(
    { [`BRIBE-REWARDS-EPOCH-${getCurrentEpochTimestamp()}`]: proofs },
    "proofs.json"
  );

  await jsonToFirestore();

  console.log("Done");
});
