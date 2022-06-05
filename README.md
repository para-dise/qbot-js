# qbot-js

QBot-JS is a NodeJS implementation of the [QBot](https://github.com/geniosa/qbot/) server

## Installation

Make sure you have NodeJS and NPM installed

```bash
npm install -g typescript # Install TypeScript
git clone https://github.com/para-dise/qbot-js/ # Clone repo
cd qbot-js
npx tsc
node .\dist\qbot.js BOTPORT ANYTHING CNCPORT # Change values, botport = slaves, anything = 0, cncport = master port
```

## Event-Based
All of the code is either async or event-based so there is no need for the original threading like there was in Qbot

## Security Issues
There are a few potential security issues which I have not fixed from the original QBot, those being:
- Bruteforce protection missing
- Any client can report probing as done
- Scan report spam missing
- Any client can kill all of the attacks (permission issue)

## Bugs
Of course, there are also a few original bugs:
- Duped bots are allowed to connect
- Missing a few commands from the help (ls, STATUS)
- No validation on !* commands

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
