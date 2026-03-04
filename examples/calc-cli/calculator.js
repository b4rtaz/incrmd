#!/usr/bin/env node

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");
const expression = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : args;

if (expression.length !== 3) {
  console.error("Usage: node calculator.js -- <first-number> <operator> <second-number>");
  process.exit(1);
}

const [leftRaw, operator, rightRaw] = expression;
const left = Number(leftRaw);
const right = Number(rightRaw);

if (Number.isNaN(left) || Number.isNaN(right)) {
  console.error("Both operands must be valid numbers.");
  process.exit(1);
}

let result;

switch (operator) {
  case "+":
    result = left + right;
    break;
  case "-":
    result = left - right;
    break;
  case "*":
    result = left * right;
    break;
  case "/":
    result = left / right;
    break;
  case "mod":
    result = left % right;
    break;
  case "pow":
    result = left ** right;
    break;
  default:
    console.error("Unsupported operator. Use one of: +, -, *, /, mod, pow.");
    process.exit(1);
}

console.log(result);
