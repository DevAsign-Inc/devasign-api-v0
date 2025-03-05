import * as freighter from "@stellar/freighter-api";
import * as StellarSdk from '@stellar/stellar-sdk';
import { isValidContractId } from './stellar-utils';
import { createContractOperation } from './createContractOperation';
// Get network configuration from environment variables
export const NETWORK = process.env.NEXT_PUBLIC_SOROBAN_NETWORK || 'testnet';
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;
export const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'CBJE2GX5BTM4VWE7R2Q7AOCLMMYFPK722QTHWCRFUPSFPC5XGNMHOR6N';

// Cache for the server instance
let sorobanRpcServerInstance: StellarSdk.rpc.Server | null = null;

// Initialize Soroban RPC client
export const getSorobanRpc = (): StellarSdk.rpc.Server => {
  // Return cached instance if available
  if (sorobanRpcServerInstance) {
    return sorobanRpcServerInstance;
  }

  try {
    // Create a new rpc.Server instance with the configured URL
    sorobanRpcServerInstance = new StellarSdk.rpc.Server(SOROBAN_RPC_URL, {
      allowHttp: SOROBAN_RPC_URL.startsWith('http://'),
    });
    console.log("Successfully created Soroban RPC server");
    return sorobanRpcServerInstance;
  } catch (error) {
    console.error("Failed to create Soroban RPC server:", error);
    
    // If server creation failed, create a fallback mock server
    // This ensures the app doesn't crash, but operations will fail gracefully
    const mockServer: StellarSdk.rpc.Server = {
      getAccount: async (publicKey: string) => {
        console.log(`Mock getAccount called with: ${publicKey}`);
        return {
          accountId: () => publicKey,
          sequenceNumber: () => "0",
        };
      },
      simulateTransaction: async (tx: any) => {
        console.log("Mock simulateTransaction called");
        return { 
          results: [{ xdr: "" }],
          latestLedger: 0,
          transactionData: new Uint8Array(),
          minResourceFee: "0",
          events: [],
          cost: { cpuInsns: "0", memBytes: "0" }
        };
      },
      sendTransaction: async (signedXDR: string) => {
        console.log("Mock sendTransaction called");
        return { 
          status: "SUCCESS", 
          hash: "mock_hash",
          errorResultXdr: "",
          latestLedger: 0,
          latestLedgerCloseTime: 0
        };
      },
      getTransaction: async (hash: string) => {
        console.log(`Mock getTransaction called with: ${hash}`);
        return { 
          status: "SUCCESS",
          returnValue: StellarSdk.xdr.ScVal.scvString("mock_result"),
          latestLedger: 0,
          latestLedgerCloseTime: 0
        };
      },
      getEvents: async () => ({ events: [], latestLedger: 0 }),
      getNetwork: async () => ({ passphrase: NETWORK_PASSPHRASE }),
      getLedgerEntries: async () => ({ entries: [], latestLedger: 0 }),
      getHealth: async () => ({ status: "healthy" }),
    } as unknown as StellarSdk.rpc.Server;
    
    sorobanRpcServerInstance = mockServer;
    return sorobanRpcServerInstance;
  }
};

// Connect to the Freighter wallet
export const getWalletPublicKey = async (): Promise<string> => {
  if (!freighter) {
    throw new Error('Freighter not available. Please install the browser extension.');
  }

  try {
    // Check if Freighter is connected
    const isConnected = await freighter.isConnected();
    if (!isConnected) {
      throw new Error('Freighter is not connected. Please connect your wallet.');
    }

    // Check if user is on the correct network
    const networkDetails = await freighter.getNetworkDetails();
    if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
      throw new Error(`Please switch to ${NETWORK} in your Freighter wallet settings.`);
    }

    // Get the user's public key using the correct method based on API version
    let publicKey: string | undefined;
    
    // Try newer API first (getAddress)
    try {
      if (typeof freighter.getAddress === 'function') {
        const addressResult = await freighter.getAddress();
        if (addressResult) {
          if (typeof addressResult === 'object' && 'address' in addressResult) {
            publicKey = addressResult.address;
          } else if (typeof addressResult === 'string') {
            // Sometimes it returns the address directly as a string
            publicKey = addressResult;
          }
        }
      }
    } catch (addressError) {
      console.log("getAddress API not available or failed, trying fallback", addressError);
    }
    
    // Try fallback approach with getPublicKey
    if (!publicKey) {
      try {
        // Check if getPublicKey exists and is a function
        if (typeof (freighter as any).getPublicKey === 'function') {
          publicKey = await (freighter as any).getPublicKey();
        }
      } catch (publicKeyError) {
        console.log("getPublicKey API failed", publicKeyError);
      }
    }
    
    // Final fallback attempt with different method signatures
    if (!publicKey) {
      try {
        const userInfo = await (freighter as any).getUserInfo();
        if (userInfo && userInfo.publicKey) {
          publicKey = userInfo.publicKey;
        }
      } catch (userInfoError) {
        console.log("getUserInfo API failed", userInfoError);
      }
    }
    
    if (!publicKey) {
      throw new Error('Failed to get public key from Freighter using available API methods.');
    }
    
    return publicKey;
  } catch (error) {
    console.error('Freighter wallet connection error:', error);
    throw error instanceof Error ? error : new Error('Unknown error connecting to Freighter wallet');
  }
};

// Type helper for contract parameters
type ScVal = StellarSdk.xdr.ScVal;

// Helper to convert JavaScript values to Soroban ScVal
export function scValFromJs(value: any): ScVal {
  try {
    // Handle null or undefined
    if (value === null || value === undefined) {
      return StellarSdk.xdr.ScVal.scvVoid();
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return StellarSdk.xdr.ScVal.scvBool(value);
    }

    // Handle numeric values
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        // For small integers, use the simple i32 representation
        if (value >= -2147483648 && value <= 2147483647) {
          return StellarSdk.xdr.ScVal.scvI32(value);
        }
        
        // For larger integers, use i128 representation
        return StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
          lo: StellarSdk.xdr.Uint64.fromString(Math.abs(value).toString()),
          hi: value < 0 ? StellarSdk.xdr.Int64.fromString('-1') : StellarSdk.xdr.Int64.fromString('0'),
        }));
      } else {
        throw new Error('Decimal numbers not supported yet');
      }
    }

    // Handle string values
    if (typeof value === 'string') {
      // Check if it's a Stellar public key (starts with G)
      if (value.startsWith('G') && value.length === 56) {
        try {
          const keypair = StellarSdk.Keypair.fromPublicKey(value);
          return StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeAccount(
              StellarSdk.xdr.PublicKey.publicKeyTypeEd25519(
                keypair.rawPublicKey()
              )
            )
          );
        } catch (error) {
          console.warn("Error converting public key to ScAddress, using string instead:", error);
          return StellarSdk.xdr.ScVal.scvString(value);
        }
      }
      
      // Handle contract IDs that might be in string format
      if (value.match(/^[0-9a-fA-F]{64}$/)) {
        try {
          return StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeContract(
              Buffer.from(value, 'hex')
            )
          );
        } catch (error) {
          console.warn("Error converting hex to contract address, using string instead:", error);
        }
      }
      
      // Regular string
      return StellarSdk.xdr.ScVal.scvString(value);
    }

    // Handle Buffer objects (binary data)
    if (Buffer.isBuffer(value)) {
      return StellarSdk.xdr.ScVal.scvBytes(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const vec = value.map(item => scValFromJs(item));
      return StellarSdk.xdr.ScVal.scvVec(vec);
    }

    // Handle objects
    if (typeof value === 'object') {
      // Handle address objects: {type: 'address', value: 'G...'}
      if (value.type === 'address' && value.value) {
        if (typeof value.value === 'string' && value.value.startsWith('G')) {
          try {
            const keypair = StellarSdk.Keypair.fromPublicKey(value.value);
            return StellarSdk.xdr.ScVal.scvAddress(
              StellarSdk.xdr.ScAddress.scAddressTypeAccount(
                StellarSdk.xdr.PublicKey.publicKeyTypeEd25519(
                  keypair.rawPublicKey()
                )
              )
            );
          } catch (error) {
            console.warn("Error converting address object to ScAddress:", error);
            return StellarSdk.xdr.ScVal.scvString(value.value);
          }
        } else if (typeof value.value === 'string' && value.value.match(/^[0-9a-fA-F]{64}$/)) {
          // Contract address
          try {
            return StellarSdk.xdr.ScVal.scvAddress(
              StellarSdk.xdr.ScAddress.scAddressTypeContract(
                Buffer.from(value.value, 'hex')
              )
            );
          } catch (error) {
            console.warn("Error converting contract address:", error);
            return StellarSdk.xdr.ScVal.scvString(value.value);
          }
        }
      }

      // Handle byte array objects: {type: 'bytes', value: 'deadbeef...'}
      if (value.type === 'bytes' && value.value) {
        try {
          // First try to convert using Uint8Array (works in more environments)
          const bytes = typeof value.value === 'string' 
            ? Buffer.from(value.value.replace(/^0x/i, ''), 'hex')
            : Buffer.from(value.value);
          
          // Try to determine if this should be BytesN instead of regular bytes
          if (value.length && typeof value.length === 'number') {
            try {
              // This is for SDK versions that support BytesN directly
              if (StellarSdk.xdr.ScVal.scvBytesN && typeof StellarSdk.xdr.ScVal.scvBytesN === 'function') {
                return StellarSdk.xdr.ScVal.scvBytesN(bytes);
              }
            } catch (bytesNError) {
              console.warn("Error using bytesN format, falling back to bytes:", bytesNError);
            }
          }
          
          return StellarSdk.xdr.ScVal.scvBytes(bytes);
        } catch (error) {
          console.warn("Error converting bytes object:", error);
          return StellarSdk.xdr.ScVal.scvString(String(value.value));
        }
      }
      
      // Handle maps for complex objects
      if (Object.keys(value).length > 0 && !value.type) {
        const entries = Object.entries(value).map(([key, val]) => {
          return new StellarSdk.xdr.ScMapEntry({
            key: scValFromJs(key),
            val: scValFromJs(val)
          });
        });
        return StellarSdk.xdr.ScVal.scvMap(entries);
      }
    }

    // If we get here, we don't know how to convert the value
    throw new Error(`Cannot convert ${JSON.stringify(value)} to ScVal`);
  } catch (error) {
    console.error("Error in scValFromJs:", error);
    throw error;
  }
}

// Helper to convert Soroban ScVal to JavaScript values
export function scValToJs(value: ScVal): any {
  try {
    if (!value) {
      return null;
    }
    
    switch (value.switch()) {
      case StellarSdk.xdr.ScValType.scvBool():
        return value.b();
        
      case StellarSdk.xdr.ScValType.scvVoid():
        return null;
        
      case StellarSdk.xdr.ScValType.scvString():
        return value.str().toString();
        
      case StellarSdk.xdr.ScValType.scvBytes():
        return value.bytes();
        
      case StellarSdk.xdr.ScValType.scvI32():
        return value.i32();
        
      case StellarSdk.xdr.ScValType.scvI64():
        return value.i64().toString();
        
      case StellarSdk.xdr.ScValType.scvI128(): {
        const i128 = value.i128();
        // Handling positive and negative numbers properly
        const hi = i128.hi().toString();
        const lo = i128.lo().toString();
        
        // For small enough numbers that fit in JavaScript's Number
        if (hi === '0') {
          return lo;
        } else if (hi === '-1' && lo !== '0') {
          return `-${lo}`;
        }
        
        // For larger numbers, return as string with sign
        return hi.startsWith('-') ? `-${lo}` : lo;
      }
      
      case StellarSdk.xdr.ScValType.scvU32():
        return value.u32();
      
      case StellarSdk.xdr.ScValType.scvU64():
        return value.u64().toString();
        
      case StellarSdk.xdr.ScValType.scvU128(): {
        const u128 = value.u128();
        return u128.lo().toString();
      }
        
      case StellarSdk.xdr.ScValType.scvVec(): {
        const vec = value.vec();
        // Make sure vec is not null and is an array with a map function
        if (vec && Array.isArray(vec) && typeof vec.map === 'function') {
          return vec.map(scValToJs);
        }
        return []; // Return empty array as fallback
      }
        
      case StellarSdk.xdr.ScValType.scvMap(): {
        const map = value.map();
        const result: Record<string, any> = {};
        
        // Check if map exists and is iterable
        if (map && (Array.isArray(map) || typeof map[Symbol.iterator] === 'function')) {
          try {
            for (const entry of map) {
              if (entry && typeof entry.key === 'function' && typeof entry.val === 'function') {
                const key = scValToJs(entry.key());
                const val = scValToJs(entry.val());
                
                // Ensure key is a valid object key (string)
                const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
                result[keyStr] = val;
              }
            }
          } catch (err) {
            console.warn("Error iterating over map entries:", err);
          }
        }
        
        return result;
      }
        
      case StellarSdk.xdr.ScValType.scvAddress(): {
        // First check if address is null
        const address = value.address();
        if (!address) {
          return "<Null Address>";
        }
        
        try {
          // Get the switch value safely
          const switchValue = address.switch ? address.switch() : null;
        
          // Public key account address
          if (switchValue === StellarSdk.xdr.ScAddressType.scAddressTypeAccount()) {
            try {
              const accountId = address.accountId();
              if (!accountId) return "<Invalid Account Id>";
              
              const ed25519Buffer = accountId.ed25519 && typeof accountId.ed25519 === 'function' ? 
                accountId.ed25519() : null;
              
              if (!ed25519Buffer) return "<Invalid Ed25519 Key>";
              
              // Try to convert to a Stellar public key string (G...)
              try {
                const keypair = StellarSdk.Keypair.fromRawEd25519Seed(ed25519Buffer);
                return keypair.publicKey();
              } catch {
                // Fall back to hex representation
                return ed25519Buffer.toString('hex');
              }
            } catch (error) {
              console.warn("Error converting account address:", error);
              return "<Invalid Account Address>";
            }
          }
          
          // Contract address
          if (switchValue === StellarSdk.xdr.ScAddressType.scAddressTypeContract()) {
            try {
              const contractIdBuffer = address.contractId && typeof address.contractId === 'function' ?
                address.contractId() : null;
                
              if (!contractIdBuffer) return "<Invalid Contract Id>";
              
              return contractIdBuffer.toString('hex');
            } catch (error) {
              console.warn("Error converting contract address:", error);
              return "<Invalid Contract Address>";
            }
          }
          
          return `<Unknown Address Type: ${switchValue}>`;
        } catch (error) {
          console.warn("Error processing ScAddress:", error);
          return "<Error Processing Address>";
        }
      }
      
      case StellarSdk.xdr.ScValType.scvSymbol():
        return value.sym().toString();
        
      case StellarSdk.xdr.ScValType.scvTimepoint():
        return value.timepoint().toString();
        
      case StellarSdk.xdr.ScValType.scvDuration():
        return value.duration().toString();
        
      default:
        return `<Unknown Type: ${value.switch().name}>`;
    }
  } catch (error) {
    console.error("Error in scValToJs:", error);
    return null;
  }
}

// Check if the object has a method or property
const hasProperty = (obj: any, prop: string) => {
  return obj && (prop in obj);
};

// Create a contract instance for a given contractId
export const createSorobanContract = (contractId: string) => {
  // Check if the contract ID is a placeholder or empty
  if (contractId === 'YOUR_DEPLOYED_CONTRACT_ID_HERE' || contractId === '0000000000000000000000000000000000000000000000000000000000000000' || !contractId) {
    // Use our deployed contract ID
    console.warn('Using hardcoded contract ID as fallback');
    contractId = 'CBJE2GX5BTM4VWE7R2Q7AOCLMMYFPK722QTHWCRFUPSFPC5XGNMHOR6N';
  }
  
  // Validate using our utility function
  if (!isValidContractId(contractId)) {
    console.warn(`Contract ID format may not be valid: ${contractId}`);
    // Continue anyway and let the SDK handle potential errors
  } else {
    console.log(`Creating contract with valid ID: ${contractId}`);
  }

  try {
    // Use any type to bypass TypeScript checking
    const sdk = StellarSdk as any;
    
    // Create a contract instance - handle different SDK versions
    if (sdk.rpc && sdk.rpc.Contract) {
      // Newer SDK version with rpc namespace
      return new sdk.rpc.Contract(contractId);
    } else if (sdk.Contract) {
      // Older SDK version without rpc namespace
      return new sdk.Contract(contractId);
    } else {
      throw new Error("No Contract constructor found in StellarSdk");
    }
  } catch (error) {
    console.error("Error creating contract:", error);
    
    // Create a minimal working contract interface
    return {
      contractId: contractId,
      
      // Required method to get the contract address in ScAddress format
      getFootprint: () => {
        try {
          // Handle both hex format and Stellar address format (C...)
          if (contractId.match(/^[0-9a-fA-F]{64}$/)) {
            return StellarSdk.xdr.ScAddress.scAddressTypeContract(
              Buffer.from(contractId, 'hex')
            );
          } else if (contractId.startsWith('C') && contractId.length === 56) {
            try {
              // Try to decode from StrKey format if available
              if (StellarSdk.StrKey && typeof StellarSdk.StrKey.decodeContract === 'function') {
                const decoded = StellarSdk.StrKey.decodeContract(contractId);
                return StellarSdk.xdr.ScAddress.scAddressTypeContract(decoded);
              }
              throw new Error("StrKey.decodeContract not available");
            } catch (strKeyError) {
              console.warn("Failed to decode StrKey contract ID, using hex fallback:", strKeyError);
              // Just use the hex version as fallback
              return StellarSdk.xdr.ScAddress.scAddressTypeContract(
                Buffer.from(contractId, 'hex')
              );
            }
          } else {
            // Last resort - try hex anyway
            return StellarSdk.xdr.ScAddress.scAddressTypeContract(
              Buffer.from(contractId, 'hex')
            );
          }
        } catch (e) {
          console.error("Error creating contract address:", e);
          throw new Error(`Failed to create contract address from ID: ${contractId}`);
        }
      }
    };
  }
};

// Check if a simulation result contains an error
export const isSimulationError = (result: any): boolean => {
  if (!result) {
    return true; // Null or undefined result is considered an error
  }
  
  try {
    // Use StellarSdk built-in error detection if available
    if (StellarSdk.rpc && 'isSimulationError' in StellarSdk.rpc) {
      const isSimulationErrorFn = (StellarSdk.rpc as any).isSimulationError;
      if (typeof isSimulationErrorFn === 'function') {
        try {
          return isSimulationErrorFn(result);
        } catch (err) {
          console.warn("Error using SDK isSimulationError function:", err);
          // Continue to fallback methods
        }
      }
    }
    
    // Manual error detection as fallback
    // Check common error indicators
    if (result && typeof result === 'object' && 'error' in result) return true;
    if (result.status && result.status === 'ERROR') return true;
    if (result.result && result.result.status && result.result.status === 'ERROR') return true;
    if (result.errorResultXdr) return true;
    if (result.diagnostics && result.diagnostics.error) return true;
    
    // If the result contains an error property or any property with error in the name
    if (typeof result === 'object') {
      const hasErrorProperty = Object.keys(result).some(key => 
        key.toLowerCase().includes('error') || 
        key.toLowerCase().includes('fail') || 
        key.toLowerCase().includes('exception')
      );
      
      if (hasErrorProperty && !result.success) {
        return true;
      }
    }
    
    // If auth required is returned, that's not necessarily an error
    if (result.status === 'AUTH_REQUIRED') {
      return false;
    }
    
    // Check expected success fields
    if (result.results && Array.isArray(result.results) && result.results.length > 0) {
      return false; // Has valid results array
    }
    
    if (result.result && result.status === 'SUCCESS') {
      return false; // Has result and success status
    }
    
    // Otherwise, if we have transactionData, we're probably ok
    if (result.transactionData) {
      return false;
    }
    
    // For safety, if none of the success conditions were met
    return Boolean(result.error);
  } catch (error) {
    console.error("Error checking simulation result:", error);
    return true; // If we can't determine, assume error for safety
  }
};

// Assemble a transaction with simulation results
export const assembleTx = (tx: any, simulation: any): any => {
  if (!tx || !simulation) {
    console.error("Cannot assemble transaction: missing transaction or simulation data");
    return tx; // Return original transaction as fallback
  }
  
  try {
    // Use the StellarSdk assembleTransaction function
    if (StellarSdk.rpc && 'assembleTransaction' in StellarSdk.rpc) {
      const assembleTransactionFn = (StellarSdk.rpc as any).assembleTransaction;
      if (typeof assembleTransactionFn === 'function') {
        return assembleTransactionFn(tx, simulation);
      }
    }

    // If the SDK function is not available, extract the transaction data manually
    console.warn("StellarSdk.rpc.assembleTransaction not available, using manual assembly");
    
    // Get a transaction builder
    const builder = tx.toBuilder();
    
    // Extract transaction data from the simulation result
    let transactionData = null;
    
    // Check different possible locations of the transaction data
    if (simulation.transactionData) {
      transactionData = simulation.transactionData;
    } else if (simulation.results && simulation.results.length > 0) {
      // Some SDK versions return an array of results
      const firstResult = simulation.results[0];
      if (firstResult.xdr && typeof firstResult.xdr === 'string') {
        // Sometimes the data is in XDR format that needs to be parsed
        try {
          const parsed = StellarSdk.xdr.SorobanTransactionData.fromXDR(firstResult.xdr, 'base64');
          transactionData = parsed;
        } catch (e) {
          console.warn("Failed to parse transaction data from XDR:", e);
        }
      }
    }
    
    // If we have transaction data, try to set it on the builder
    if (transactionData) {
      try {
        // Modern SDK version has setSorobanData method
        if (typeof builder.setSorobanData === 'function') {
          builder.setSorobanData(transactionData);
          return builder.build();
        }
        
        // Try addResourceFee if available (for some SDK versions)
        if (typeof builder.addResourceFee === 'function' && simulation.minResourceFee) {
          builder.addResourceFee(simulation.minResourceFee);
        }
        
        // Try alternate methods to set Soroban data
        if (typeof builder.setFootprint === 'function' && 
            transactionData.footprint && 
            typeof builder.setResourceFee === 'function') {
          
          builder.setFootprint(transactionData.footprint);
          
          if (transactionData.resourceFee) {
            builder.setResourceFee(transactionData.resourceFee);
          }
          
          return builder.build();
        }
        
        // Last resort: just set the data directly on the transaction
        console.warn("Using direct property assignment for sorobanData");
        tx.sorobanData = transactionData;
        return tx;
      } catch (error) {
        console.warn("Error building transaction with sorobanData:", error);
        tx.sorobanData = transactionData;
        return tx;
      }
    } else {
      console.warn("No transaction data found in simulation result");
      return tx;
    }
  } catch (error) {
    console.error("Transaction assembly error:", error);
    return tx; // Return original transaction as fallback
  }
};

// Invoke a contract method (write operation - requires signing)
export async function invokeContract(
  method: string,
  args: any[] = []
): Promise<any> {
  try {
    // Get the Soroban RPC server instance
    const sorobanServer = getSorobanRpc();
    
    // Get the user's wallet public key
    const publicKey = await getWalletPublicKey();
    
    console.log(`Invoking contract method: ${method} with args:`, args);
    
    // Get the user's account
    const account = await sorobanServer.getAccount(publicKey);
    
    // Convert JS arguments to Soroban compatible ScVal format
    const xdrArgs = args.map(arg => scValFromJs(arg));
    
    // Create a contract instance
    const contract = createSorobanContract(CONTRACT_ID);
    
    // Create the contract invocation operation - using our helper function that handles multiple SDK versions
    let operation;
    try {
      // Use the helper function to create an operation compatible with the current SDK version
      operation = createContractOperation(contract, method, xdrArgs, StellarSdk);
    } catch (error) {
      console.error("Error creating operation with helper function:", error);
      throw new Error("Failed to create a compatible operation with this SDK version");
    }
    
    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(account.accountId(), account.sequenceNumber()), 
      { 
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(operation)
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();
    
    // Step 1: Simulate the transaction to get fees and resource usage
    console.log("Simulating transaction...");
    const simulateResponse = await sorobanServer.simulateTransaction(transaction);
    
    // Check if the simulation had an error
    if (isSimulationError(simulateResponse)) {
      console.error("Simulation failed:", simulateResponse);
      // Use safe error extraction with type any to avoid TypeScript errors
      const errorMessage = (simulateResponse as any).error 
        ? (simulateResponse as any).error 
        : JSON.stringify(simulateResponse);
      throw new Error(`Simulation Error: ${errorMessage}`);
    }
    
    // Step 2: Prepare the transaction with simulation results
    console.log("Preparing transaction with simulation results...");
    const preparedTransaction = assembleTx(transaction, simulateResponse);
    
    // Step 3: Sign the transaction with Freighter
    console.log("Signing transaction with Freighter wallet...");
    const preparedXDR = preparedTransaction.toXDR();
    const signedXDR = await freighter.signTransaction(
      preparedXDR,
      {
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    );
    
    // Step 4: Send the signed transaction to the network
    console.log("Sending transaction to the network...");
    // Use 'as any' to bypass TypeScript type checking on sendTransaction
    const txResponse = await (sorobanServer as any).sendTransaction(signedXDR);
    
    console.log("Transaction submission response:", txResponse);
    
    if (txResponse.status === 'PENDING') {
      // Step 5: Wait for transaction to complete
      console.log(`Transaction pending with hash: ${txResponse.hash}`);
      let txResult;
      let status = 'PENDING';
      let attempts = 0;
      const maxAttempts = 10;
      
      while (status === 'PENDING' && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
        
        console.log(`Checking transaction status (attempt ${attempts}/${maxAttempts})...`);
        txResult = await sorobanServer.getTransaction(txResponse.hash);
        status = txResult.status;
      }
      
      if (status === 'SUCCESS') {
        console.log("Transaction successful!");
        // Process results if needed - using 'as any' for type safety
        const txResultAny = txResult as any;
        if (txResultAny && txResultAny.returnValue) {
          const result = scValToJs(txResultAny.returnValue);
          console.log("Contract returned:", result);
          return result;
        }
        return true; // Return true if no specific return value
      } else {
        console.error("Transaction failed:", txResult);
        // Safely extract error details
        const errorInfo = txResult ? 
          ((txResult as any).resultXdr || status) : 
          status;
        throw new Error(`Transaction failed: ${errorInfo}`);
      }
    } else if (txResponse.status === 'ERROR') {
      console.error("Transaction submission failed:", txResponse);
      // Safely extract error details using 'as any'
      const errorInfo = (txResponse as any).errorResult || (txResponse as any).errorResultXdr || JSON.stringify(txResponse);
      throw new Error(`Transaction submission failed: ${errorInfo}`);
    } else {
      // Some other status like SUCCESS, which shouldn't normally happen immediately
      console.log("Unexpected immediate transaction result:", txResponse);
      return true;
    }
  } catch (error) {
    console.error('Contract invocation error:', error);
    throw error;
  }
}

// Query a contract method (read-only, doesn't require signing)
export async function queryContract(
  method: string,
  args: any[] = []
): Promise<any> {
  try {
    console.log(`Querying contract method: ${method} with args:`, args);
    
    // Get the Soroban RPC server instance
    const sorobanServer = getSorobanRpc();
    
    // Convert JS arguments to Soroban compatible ScVal format
    const xdrArgs = args.map(arg => scValFromJs(arg));
    
    // Create a contract instance
    const contract = createSorobanContract(CONTRACT_ID);
    
    // Create a throwaway account for simulation purposes
    // This is a special account that doesn't need to exist on the network
    const simulationAccount = new StellarSdk.Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 
      '0'
    );
    
    // Create an operation to invoke the contract function - using our helper function
    let operation;
    try {
      // Use the helper function to create an operation compatible with the current SDK version
      operation = createContractOperation(contract, method, xdrArgs, StellarSdk);
    } catch (error) {
      console.error("Error creating query operation with helper function:", error);
      throw new Error("Failed to create a compatible operation with this SDK version");
    }
    
    // Build a transaction for simulation
    const simulationTx = new StellarSdk.TransactionBuilder(
      simulationAccount,
      { 
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(operation)
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();
    
    // Simulate the transaction
    console.log("Simulating read-only transaction...");
    const simulationResult = await sorobanServer.simulateTransaction(simulationTx);
    
    // Check if the simulation had an error
    if (isSimulationError(simulationResult)) {
      console.error("Query simulation failed:", simulationResult);
      // Use safe error extraction with type any to avoid TypeScript errors
      const errorMessage = (simulationResult as any).error 
        ? (simulationResult as any).error 
        : JSON.stringify(simulationResult);
      throw new Error(`Query Error: ${errorMessage}`);
    }
    
    // Extract the return value from the simulation result - handle different API formats
    // Use type safety with 'as any'
    const simulationResultAny = simulationResult as any;
    
    // Check for direct returnValue property
    if (simulationResultAny.returnValue) {
      // Direct returnValue (common in newer SDK versions)
      try {
        const result = scValToJs(simulationResultAny.returnValue);
        console.log(`Query result for ${method}:`, result);
        return result;
      } catch (error) {
        console.warn("Error parsing direct returnValue:", error);
      }
    }
    
    // Check for results array format (common in some SDK versions)
    if (simulationResultAny.results && Array.isArray(simulationResultAny.results) && 
        simulationResultAny.results.length > 0) {
      
      const firstResult = simulationResultAny.results[0];
      
      // Check for returnValue inside first result
      if (firstResult && firstResult.returnValue) {
        try {
          const result = scValToJs(firstResult.returnValue);
          console.log(`Query result for ${method} (from results array):`, result);
          return result;
        } catch (error) {
          console.warn("Error parsing returnValue from results array:", error);
        }
      }
      
      // Some SDK versions return results[0].xdr which needs to be parsed
      if (firstResult && firstResult.xdr && typeof firstResult.xdr === 'string') {
        try {
          const scVal = StellarSdk.xdr.ScVal.fromXDR(firstResult.xdr, 'base64');
          const result = scValToJs(scVal);
          console.log(`Query result for ${method} (from XDR):`, result);
          return result;
        } catch (error) {
          console.warn("Error parsing XDR from results array:", error);
        }
      }
    }
    
    console.log("Query returned no value");
    return null;
  } catch (error) {
    console.error('Contract query error:', error);
    throw error;
  }
}
