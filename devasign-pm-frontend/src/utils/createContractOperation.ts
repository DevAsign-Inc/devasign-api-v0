/**
 * HELPER FUNCTION: Safely create an operation for contract interaction
 * Works across different versions of the Stellar SDK
 * 
 * This implementation specifically handles SDK 13.1.0 which uses invokeContractFunction
 * instead of invokeContract or other approaches
 */
export function createContractOperation(
  contract: any, 
  method: string, 
  args: any[], 
  sdk: any
): any {
  // First try SDK 13.1.0 approach with invokeContractFunction - most likely to work
  if (sdk.Operation && sdk.Operation.invokeContractFunction) {
    try {
      const footprint = contract.getFootprint ? contract.getFootprint() : contract.contractId;
      return sdk.Operation.invokeContractFunction({
        contractAddress: footprint,
        functionName: method, 
        args: args
      });
    } catch (error) {
      console.error("Error using invokeContractFunction:", error);
      // Fall through to next approach
    }
  }
  // Try different approaches based on SDK version
  // Approach 1: Modern SDK with Operation.invokeContract
  if (sdk.Operation.invokeContract && typeof sdk.Operation.invokeContract === 'function') {
    try {
      const footprint = contract.getFootprint ? contract.getFootprint() : contract.contractId;
      return sdk.Operation.invokeContract({
        contract: footprint,
        function: method,
        args: args
      });
    } catch (error) {
      console.error("Error using invokeContract:", error);
      // Fall through to next approach
    }
  }
  
  // Approach 2: SDK with Operation.invokeHostFunction and function parameter
  if (sdk.Operation.invokeHostFunction && typeof sdk.Operation.invokeHostFunction === 'function') {
    try {
      if (sdk.xdr && sdk.xdr.HostFunction) {
        // Try based on how HostFunction.invokeContract is available
        if (typeof sdk.xdr.HostFunction.invokeContract === 'function') {
          try {
            const footprint = contract.getFootprint ? contract.getFootprint() : contract.contractId;
            return sdk.Operation.invokeHostFunction({
              function: sdk.xdr.HostFunction.invokeContract(
                new sdk.xdr.InvokeContractArgs({
                  contractAddress: footprint,
                  functionName: method,
                  args: args
                })
              ),
              auth: []
            });
          } catch (innerError) {
            console.error("Error using HostFunction.invokeContract:", innerError);
            // Continue to next approach
          }
        }
        
        // Try with HostFunctionType enum if available
        if (sdk.xdr.HostFunctionType && sdk.xdr.HostFunctionType.invokeContract) {
          try {
            const footprint = contract.getFootprint ? contract.getFootprint() : contract.contractId;
            return sdk.Operation.invokeHostFunction({
              hostFunction: new sdk.xdr.HostFunction(
                sdk.xdr.HostFunctionType.invokeContract(),
                new sdk.xdr.InvokeContractArgs({
                  contractAddress: footprint,
                  functionName: method,
                  args: args
                })
              ),
              auth: []
            });
          } catch (innerError) {
            console.error("Error using HostFunctionType.invokeContract:", innerError);
            // Continue to next approach
          }
        }
      }
    } catch (err) {
      console.log("Could not create operation with function parameter:", err);
    }
    
    // Approach 3: Try with simple hostFunction parameter structure
    try {
      return sdk.Operation.invokeHostFunction({
        hostFunction: {
          contractId: typeof contract === 'string' ? contract : contract.contractId,
          functionName: method,
          args: args
        },
        auth: []
      });
    } catch (err) {
      console.log("Could not create operation with simple hostFunction:", err);
    }
    
    // Approach 4: Even more basic approach
    try {
      return sdk.Operation.invokeHostFunction({
        function: method,
        parameters: args,
        contractId: typeof contract === 'string' ? contract : contract.contractId,
        auth: []
      });
    } catch (err) {
      console.log("Could not create operation with basic approach:", err);
    }
  }
  
  // If we reach here, no approach worked - throw an error
  throw new Error("No compatible operation creation method found for this SDK version");
}
