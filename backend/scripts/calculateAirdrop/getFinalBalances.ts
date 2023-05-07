import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import { getLiqSnapshotsForPair } from "../../subgraph/fetchers";
import { BigNumber } from "ethers";
import { AirdropAmounts, LiqSnapshot, UserData } from ".";

task(
  "get-final-balances",
  "Final balance at the end, taking into account inward and outward transfers after the snapshot period"
)
  .addParam("blocknumber", "Block Number")
  .addParam("endblocknumber", "End Block Number")
  .addVariadicPositionalParam("addressesArray")
  .setAction(
    async (
      { blocknumber, addressesArray, endblocknumber },
      { network, ethers }
    ) => {
      const filePath = path.resolve(
        __dirname,
        "output/userBalancesSnapshot.json"
      );
      const userData = JSON.parse(fs.readFileSync(filePath).toString());

      let allBalances: AirdropAmounts = {};

      for (var index = 0; index < addressesArray.length; index++) {
        const { users, balances }: UserData = userData[addressesArray[index]];
        const allLiqSnapshots = await getLiqSnapshotsForPair(
          network.name,
          blocknumber,
          endblocknumber,
          addressesArray[index]
        );
        allBalances[addressesArray[index]] = {};
        users.forEach((user, jindex) => {
          if (user !== "0x0000000000000000000000000000000000000000") {
            let userFinalBalance = BigNumber.from(balances[jindex]);
            let overflow = BigNumber.from(0);
            allLiqSnapshots.forEach((snapshot: LiqSnapshot) => {
              if (snapshot.user.id === user) {
                const liqBalanceBN = ethers.utils.parseEther(
                  snapshot.liquidityTokenBalance
                );
                const gaugeBalanceBN = ethers.utils.parseEther(
                  snapshot.gaugeBalance
                );
                let delta = userFinalBalance
                  .mul(-1)
                  .add(liqBalanceBN)
                  .add(gaugeBalanceBN);
                overflow = overflow.add(delta);
                if (overflow.lt(0)) {
                  userFinalBalance = userFinalBalance.add(overflow);
                  overflow = BigNumber.from("0");
                }
              }
            });
            if (userFinalBalance.gt(0)) {
              allBalances[addressesArray[index]][user] = userFinalBalance;
            }
          }
        });
      }

      const outFilePath = path.resolve(
        __dirname,
        "output/userBalancesFinal.json"
      );
      fs.writeFileSync(outFilePath, JSON.stringify(allBalances));
    }
  );
