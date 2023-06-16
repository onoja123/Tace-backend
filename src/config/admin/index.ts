import AdminModel from "../../models/cargodealer.admin.model";
import RedisClient from "../../controllers/redis";

class config {
  public async get(getter: string) {
    switch (getter) {
      case "tripRates": {
        const rates = await RedisClient.get("tripRates");

        if (rates) {
          return JSON.parse(rates);
        } else {
          const adminData = await AdminModel.findOne({});

          if (adminData?.rates) {
            RedisClient.set("tripRates", JSON.stringify(adminData.rates));
          } else {
            const newOne = await AdminModel.create({});
            await newOne.save();
            RedisClient.set("tripRates", JSON.stringify(newOne.rates));
          }

          return adminData?.rates;
        }
      }
    }
  }
}

export default new config();
