import React from "react";

class UsernameSetter extends React.Component {

    constructor() {
      super();
      this.currentUsernameInput = '';
      this.state = ({
        usernameAvailable: false,
      })
    }

    componentDidMount() {
      this.get_available_accounts();
    }

    async get_available_accounts() {
      console.log(this.props.access_id);
      const resp = await fetch('http://localhost:5000/accounts_available', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({access: this.props.access_id}),
      });
    }

    async checkUsername() {
      // maybe this function is a bit confusing 
      let username = document.getElementById('usernameInput').value;
      if (this.currentUsernameInput != username) {
        this.currentUsernameInput = username;
        setTimeout( () => this.dbUsernameCheck(username), 1500 );
      };
    }

    async dbUsernameCheck(username) {
      if (this.currentUsernameInput == username) {
        await fetch('http://localhost:5000/username_check', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({'username': this.currentUsernameInput}),
        }).then(response => response.json())
        .then(data => {this.setState({ usernameAvailable: data.result });
        });
      }
    }

    render() {
      return (
        <div>
          {this.props.access_id != null ? <form>Enter username: <input id='usernameInput' onChange={() => this.checkUsername()}></input></form> : <div>Loading</div>}
          {this.state.usernameAvailable ? <button>Here we go!</button> : <></>}
        </div>
      );
    }
}

export default UsernameSetter;