;; --- bitcoin-height-trigger.clar ---
;; A contract that triggers a one-time action when a target Bitcoin block height is reached.

;; --- Constants for Errors ---
(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_ALREADY_TRIGGERED (err u101))
(define-constant ERR_HEIGHT_NOT_REACHED (err u102))
(define-constant ERR_INVALID_HEIGHT (err u103))
(define-constant ERR_TARGET_NOT_SET (err u105))

;; --- Data Variables ---
(define-data-var owner principal tx-sender)
(define-data-var target-btc-block-height (optional uint) none)
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
    (asserts! (is-owner) (err { code: ERR_OWNER_ONLY, message: "Only the owner can set the target height." }))
    (asserts! (not (var-get action-triggered)) (err { code: ERR_ALREADY_TRIGGERED, message: "Action has already been triggered." }))
    (asserts! (> height u0) (err { code: ERR_INVALID_HEIGHT, message: "Target height must be greater than zero." }))

    (var-set target-btc-block-height (some height))
    (print { event: "Target Bitcoin block height set", target: height })
    (ok true)
  )
)

;; @desc Checks if the target Bitcoin block height has been reached.
;; If yes, performs the one-time action and marks it as triggered.
;; Can be called by anyone.
(define-public (trigger-action-if-height-reached)
  (begin
    (asserts! (not (var-get action-triggered)) (err { code: ERR_ALREADY_TRIGGERED, message: "Action has already been triggered." }))

    (match (var-get target-btc-block-height)
      target-height
      (let ((current-btc-height burn-block-height))
        (if (>= current-btc-height target-height)
            (begin
              (var-set action-triggered true)
              (print { event: "Action triggered", btc-block-height-reached: current-btc-height, target: target-height })
              (ok true)
            )
            (err { code: ERR_HEIGHT_NOT_REACHED, message: "Bitcoin block height not reached yet." })
        )
      )
      (err { code: ERR_TARGET_NOT_SET, message: "Target height is not set." })
    )
  )
)

;; --- Read-Only Functions ---

;; @desc Returns the current status of the contract.
(define-read-only (get-status)
  (ok {
    owner: (var-get owner),
    target-height: (var-get target-btc-block-height),
    triggered: (var-get action-triggered)
  })
)

;; @desc Returns the current Bitcoin block height.
(define-read-only (get-current-btc-block-height)
  burn-block-height
)
