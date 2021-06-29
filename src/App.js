import './App.css';
import React, {useState} from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import UsernameSetter from './UsernameSetter.js';

async function fetchLinkToken() {
  const resp = await fetch('http://localhost:5000/create-link-token');
  const { linkToken } = await resp.json();
  return linkToken;
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      access_id: null,
      username: null,
    }
  }

  componentDidMount() {
    this.refresh_login();
  }

  async refresh_login() {
    console.log('refreshed login');
    let cookies = document.cookie;
    cookies = cookies.split('; ');
    var result = {};
    for (var i = 0; i < cookies.length; i++) {
        var cur = cookies[i].split('=');
        result[cur[0]] = cur[1];
    };
    this.setState({ access_id: result.access, username: result.username });
  }

  async login() {
    const handler = window.Plaid.create({
      token: await fetchLinkToken(),
      onSuccess: async (publicToken, metadata) => {
        console.log(publicToken);
        console.log(metadata);
        await fetch('http://localhost:5000/token-exchange', {
          method: 'POST',
          body: JSON.stringify({ publicToken }),
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        this.refresh_login();
        if (this.state.username == 'unset') {
          window.location.replace("http://localhost:3000/create_account");
        }  
      },
      onExit: async (error, metadata) => {
        console.log(error);
        console.log(metadata);
      },
      onEvent: async (metadata) => {
        console.log(metadata);
      },
    });
    handler.open();
  }

  render() { 
    return (
        <Router>
          <div>
          <button onClick={() => this.login()}>TESTA</button>
          <ul>
            <li>
              <Link to="/">Discover</Link>
            </li>
            <li>
              <Link to="/my_portfolio">Portfolio</Link>
            </li>
          </ul>
          {this.state.access_id != undefined?  
            <Route exact path="/create_account"  render={() => <UsernameSetter access_id={this.state.access_id} username={this.state.username}/>} />
            : <div>Loading...</div>}

          </div>
        </Router>
  );
  }
}

export default App;
