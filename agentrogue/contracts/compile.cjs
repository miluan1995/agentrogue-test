const solc=require("solc"),fs=require("fs"),path=require("path");
function findImports(p){for(const base of ["node_modules/",""]){const f=path.join(base,p);if(fs.existsSync(f))return{contents:fs.readFileSync(f,"utf8")};}return{error:"not found "+p};}
const proxySrc=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";`;
const input={language:"Solidity",sources:{"AgentRogueRecords.sol":{content:fs.readFileSync("AgentRogueRecords.sol","utf8")},"Proxy.sol":{content:proxySrc}},settings:{optimizer:{enabled:true,runs:200},evmVersion:"cancun",outputSelection:{"*":{"*":["abi","evm.bytecode.object","evm.deployedBytecode.object"]}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input),{import:findImports}));
let bad=false;(out.errors||[]).forEach(e=>{console.log(e.severity,e.formattedMessage.split("\n")[0]);if(e.severity==="error")bad=true;});
if(bad)process.exit(1);
const c=out.contracts["AgentRogueRecords.sol"].AgentRogueRecords;
const p=out.contracts["@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol"].ERC1967Proxy;
fs.writeFileSync("AgentRogueRecords.json",JSON.stringify({abi:c.abi,bytecode:"0x"+c.evm.bytecode.object,runtime:"0x"+c.evm.deployedBytecode.object},null,1));
fs.writeFileSync("ERC1967Proxy.json",JSON.stringify({abi:p.abi,bytecode:"0x"+p.evm.bytecode.object},null,1));
console.log("impl bytes",c.evm.bytecode.object.length/2,"proxy bytes",p.evm.bytecode.object.length/2);
