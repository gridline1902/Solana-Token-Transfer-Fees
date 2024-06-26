//@ts-check

import {
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const payer = Keypair.generate();

const airdropSign = await connection.requestAirdrop(
  payer.publicKey,
  LAMPORTS_PER_SOL
);

await connection.confirmTransaction({
  signature: airdropSign,
  ...(await connection.getLatestBlockhash()),
});

const mintaAuthority = Keypair.generate();
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

// for modification of transfer fee
const transferFeeConfigAuthority = Keypair.generate();

// can move tokens from either mint or token acct.
const withdrawWithHeldAuthority = Keypair.generate();

const decimals = 9;

//  fee taken from every transfer
const feeBasisPoint = 100;

const maxFee = BigInt(5_000);

const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// creates account
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: payer.publicKey,
  newAccountPubkey: mint,
  space: mintLen,
  lamports,
  programId: TOKEN_2022_PROGRAM_ID,
});

const initTransferFeeConfig = createInitializeTransferFeeConfigInstruction(
  mint,
  transferFeeConfigAuthority.publicKey,
  withdrawWithHeldAuthority.publicKey,
  feeBasisPoint,
  maxFee,
  TOKEN_2022_PROGRAM_ID
);

const initMintInstruction = createInitializeMintInstruction(
  mint,
  decimals,
  mintaAuthority.publicKey,
  mintaAuthority.publicKey,
  TOKEN_2022_PROGRAM_ID
);

const transaction = new Transaction().add(
  createAccountInstruction,
  initTransferFeeConfig,
  initMintInstruction
);

const transactionSign = await sendAndConfirmTransaction(
  connection,
  transaction,
  [payer, mintKeypair],
  undefined
);

console.log("transactionSign: ", transactionSign);
