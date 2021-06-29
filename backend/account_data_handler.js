const util = require('util');

class UserData {
    constructor(responses) {
        this.availableAccounts = this.get_account_names(responses.Identity);
    }

    get_account_names(id) {
        let account_names = [];
        console.log('Configuring available accounts');
        for (let account of id.accounts) {
            if (account.type == 'investment') {
              let owner = account.owners[0];
              let phone_id = owner.phone_numbers[0].data
              for (let phone of owner.phone_numbers) {
                  if (phone.primary) {
                      phone_id = phone.data;
                  }
              }
                // hard to identify someone.
                account_names.push({"name": account.name, "Identifier": phone_id });
            }
        }
        return account_names;
    }
}

module.exports = {
    UserData
}