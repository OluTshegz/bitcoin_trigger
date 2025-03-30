;; --- bitcoin-height-trigger.clar ---
;; A contract that triggers a one-time action when a target Bitcoin block height is reached.
;; Uses the global 'burn-block-height' variable.

;; --- Constants for Errors ---
(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_ALREADY_TRIGGERED (err u101))
(define-constant ERR_HEIGHT_NOT_REACHED (err u102))
(define-constant ERR_INVALID_HEIGHT (err u103))
;; (define-constant ERR_CANNOT_GET_BLOCK_INFO (err u104)) ;; No longer needed with global variable
(define-constant ERR_TARGET_NOT_SET (err u105))

;; --- Data Variables ---
(define-data-var owner principal tx-sender)
(define-data-var target-btc-block-height uint u0)
(define-data-var action-triggered bool false)

;; --- Private Helper Functions ---
(define-private (is-owner)
  (is-eq tx-sender (var-get owner))
)

;; --- Public Functions ---

;; @desc Allows the owner to set the target Bitcoin block height.
;; @param height: The target Bitcoin block height (must be > 0).
;; @returns (ok true) on success, or an error code.
(define-public (set-target-height (height uint))
  (begin
    (asserts! (is-owner) ERR_OWNER_ONLY)
    (asserts! (not (var-get action-triggered)) ERR_ALREADY_TRIGGERED)
    (asserts! (> height u0) ERR_INVALID_HEIGHT)

    (var-set target-btc-block-height height)
    (print { notification: "Target Bitcoin block height set", target: height })
    (ok true)
  )
)

;; @desc Checks if the target Bitcoin block height has been reached.
;; If yes, performs the one-time action and marks it as triggered.
;; Can be called by anyone.
;; @returns (ok true) if action is triggered successfully, (err ERR_HEIGHT_NOT_REACHED) if not yet reached,
;;          or other errors for invalid state.
(define-public (trigger-action-if-height-reached)
(begin
    (asserts! (not (var-get action-triggered)) (err (tuple (error ERR_ALREADY_TRIGGERED) (success false))))

    (let ((target-height (var-get target-btc-block-height))
          (current-btc-height burn-block-height))
      (asserts! (> target-height u0) (err (tuple (error ERR_TARGET_NOT_SET) (success false))))

      (if (>= current-btc-height target-height)
          (begin
            (var-set action-triggered true)
            (print { notification: "Action triggered!", btc-block-height-reached: current-btc-height, target: target-height })
            (ok true)
          )
          (err (tuple (error ERR_HEIGHT_NOT_REACHED) (success false)))
      )
    )
  )
)

;; --- Read-Only Functions ---

;; @desc Returns the current status of the contract.
;; @returns (ok { owner: principal, target-height: uint, triggered: bool })
(define-read-only (get-status)
  (ok {
    owner: (var-get owner),
    target-height: (var-get target-btc-block-height),
    triggered: (var-get action-triggered)
  })
)

;; @desc Returns the current Bitcoin block height as seen by Stacks.
;; @returns uint - The burn block height associated with the current Stacks block.
(define-read-only (get-current-btc-block-height)
  ;; --- CHANGED: Use global variable directly ---
  burn-block-height
)
