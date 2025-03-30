# Bitcoin Height Trigger Smart Contract

## Description

This Clarity smart contract for the Stacks blockchain allows a designated owner to set a target Bitcoin block height. Once the Stacks chain observes that the Bitcoin blockchain has reached or exceeded this target height, a one-time action within the contract can be triggered. This contract utilizes the global `burn-block-height` variable provided by the Stacks blockchain to track the current Bitcoin block height.

## Clarity Contract Details

* **Filename:** `bitcoin-height-trigger.clar`

### Constants for Errors

* `ERR_OWNER_ONLY (err u100)`: Returned when a non-owner attempts an owner-only action.
* `ERR_ALREADY_TRIGGERED (err u101)`: Returned if the trigger action has already been executed.
* `ERR_HEIGHT_NOT_REACHED (err u102)`: Returned when attempting to trigger the action before the target Bitcoin block height is reached.
* `ERR_INVALID_HEIGHT (err u103)`: Returned if an invalid Bitcoin block height (e.g., 0) is provided.
* `ERR_TARGET_NOT_SET (err u105)`: Returned when attempting to trigger the action before a target Bitcoin block height has been set.

### Data Variables

* `owner (principal)`: The principal address of the contract owner, initialized to the transaction sender upon deployment.
* `target-btc-block-height (uint)`: The Bitcoin block height at which the action should be triggered, initialized to 0.
* `action-triggered (bool)`: A boolean flag indicating whether the trigger action has already been executed, initialized to `false`.

### Public Functions

* **`set-target-height (height uint)`**
    * **Description:** Allows the contract owner to set the target Bitcoin block height.
    * **Parameters:**
        * `height (uint)`: The desired target Bitcoin block height (must be greater than 0).
    * **Returns:** `(ok true)` on success, or an error code if the caller is not the owner, the action has already been triggered, or the provided height is invalid.

* **`trigger-action-if-height-reached ()`**
    * **Description:** Checks if the current Bitcoin block height (`burn-block-height`) has reached or exceeded the `target-btc-block-height`. If it has and the action hasn't been triggered yet, it marks the action as triggered.
    * **Parameters:** None.
    * **Returns:** `(ok true)` if the action is triggered successfully, `(err ERR_HEIGHT_NOT_REACHED)` if the target height has not yet been reached, or other error codes for invalid contract state (e.g., if already triggered or target not set).

### Read-Only Functions

* **`get-status ()`**
    * **Description:** Returns the current status of the contract.
    * **Parameters:** None.
    * **Returns:** `(ok { owner: principal, target-height: uint, triggered: bool })` containing the owner's address, the target Bitcoin block height, and the triggered status.

* **`get-current-btc-block-height ()`**
    * **Description:** Returns the current Bitcoin block height as observed by the Stacks chain.
    * **Parameters:** None.
    * **Returns:** `uint` - The value of the `burn-block-height` global variable.

## Getting Started

To deploy and interact with this contract, you will need to have a Stacks development environment set up, including the Clarinet CLI.

1.  **Save the contract:** Save the provided Clarity code as `bitcoin-height-trigger.clar` in your `contracts` directory within your Clarinet project.

2.  **Deploy the contract:** Use the Clarinet CLI to deploy the contract to your local Stacks network:

    ```bash
    clarinet deploy
    ```

3.  **Interact with the contract:** You can interact with the public functions using the Clarinet console or by writing unit tests in TypeScript.

    * **Set the target height (as the owner):**

        ```bash
        clarinet call bitcoin-height-trigger set-target-height u100000 --sender-principal <owner-address>
        ```

        Replace `<owner-address>` with the principal address of the contract owner and `u100000` with your desired target height.

    * **Trigger the action:**

        ```bash
        clarinet call bitcoin-height-trigger trigger-action-if-height-reached --sender-principal <any-address>
        ```

    * **Get the contract status:**

        ```bash
        clarinet call-read bitcoin-height-trigger get-status --sender-principal <any-address>
        ```

    * **Get the current Bitcoin block height:**

        ```bash
        clarinet call-read bitcoin-height-trigger get-current-btc-block-height --sender-principal <any-address>
        ```

## Testing

This project includes unit tests written in TypeScript using the `@stacks/clarinet-vitest` library. To run the tests:

1.  **Install dependencies:** If you haven't already, navigate to the project root in your terminal and run:

    ```bash
    npm install
    ```

2.  **Run the tests:** Execute the following command:

    ```bash
    npm test
    ```

    This will run all the tests defined in the `tests` directory.

## License

[Your License Here (e.g., MIT, Apache 2.0)]

## Author

[Your Name/Organization]