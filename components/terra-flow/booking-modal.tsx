"use client"

import { useState } from "react"
import { Button } from "@/components/terra-flow/ui/button"
import { X, Calendar, Clock, User, Check, ChevronRight } from "lucide-react"

interface ClassDetails {
  time: string
  name: string
  instructor: string
  duration: string
  level: string
  day: string
  date: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  classDetails: ClassDetails | null
}

type Step = "details" | "payment" | "confirmation"

const paymentOptions = [
  {
    id: "drop-in",
    name: "Drop-In",
    price: 35,
    description: "Single class",
  },
  {
    id: "class-pack",
    name: "Use Class Pack",
    price: 0,
    description: "7 classes remaining",
    hasCredits: true,
  },
  {
    id: "membership",
    name: "Unlimited Membership",
    price: 0,
    description: "Included in your plan",
    hasMembership: true,
  },
]

export function BookingModal({ isOpen, onClose, classDetails }: BookingModalProps) {
  const [step, setStep] = useState<Step>("details")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [confirmationId] = useState(() =>
    `TF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  )
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !classDetails) return null

  const handleContinue = () => {
    if (step === "details") {
      setStep("payment")
    } else if (step === "payment" && selectedPayment) {
      setIsProcessing(true)
      // Simulate booking processing
      setTimeout(() => {
        setIsProcessing(false)
        setStep("confirmation")
      }, 1500)
    }
  }

  const handleClose = () => {
    setStep("details")
    setSelectedPayment(null)
    onClose()
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["details", "payment", "confirmation"].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s
                ? "bg-primary text-primary-foreground"
                : ["details", "payment", "confirmation"].indexOf(step) > i
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {["details", "payment", "confirmation"].indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < 2 && (
            <div
              className={`w-12 h-0.5 mx-1 ${
                ["details", "payment", "confirmation"].indexOf(step) > i ? "bg-primary/20" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-light mb-2">Confirm Your Class</h3>
        <p className="text-muted-foreground">Review the details below</p>
      </div>

      <div className="bg-muted rounded-xl p-6 space-y-4">
        <div className="text-center pb-4 border-b border-border">
          <h4 className="text-xl font-semibold text-primary">{classDetails.name}</h4>
          <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs uppercase tracking-wider rounded-full">
            {classDetails.level}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
              <p className="font-medium">
                {classDetails.day}, {classDetails.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
              <p className="font-medium">
                {classDetails.time} ({classDetails.duration})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Instructor</p>
            <p className="font-medium">{classDetails.instructor}</p>
          </div>
        </div>
      </div>

      <div className="bg-accent/10 rounded-lg p-4">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-medium text-foreground">Cancellation Policy:</span> Free cancellation up to 12 hours
          before class. Late cancellations will be charged.
        </p>
      </div>

      <Button onClick={handleContinue} className="w-full py-6 uppercase tracking-widest text-sm group">
        Continue to Payment
        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-light mb-2">Select Payment</h3>
        <p className="text-muted-foreground">Choose how you&apos;d like to pay</p>
      </div>

      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedPayment(option.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              selectedPayment === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPayment === option.id ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {selectedPayment === option.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
            {option.price > 0 ? (
              <span className="text-xl font-light">${option.price}</span>
            ) : (
              <span className="text-sm text-primary font-medium">Included</span>
            )}
          </button>
        ))}
      </div>


      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("details")} className="flex-1 py-6 bg-transparent">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedPayment || isProcessing}
          className="flex-1 py-6 uppercase tracking-widest text-sm"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-primary" />
      </div>

      <div>
        <h3 className="text-2xl font-light mb-2">Booking Confirmed!</h3>
        <p className="text-muted-foreground">You&apos;re all set for your class</p>
      </div>

      <div className="bg-muted rounded-xl p-6 text-left space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-muted-foreground">Class</span>
          <span className="font-medium">{classDetails.name}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-muted-foreground">Date & Time</span>
          <span className="font-medium">
            {classDetails.day}, {classDetails.date} at {classDetails.time}
          </span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-muted-foreground">Instructor</span>
          <span className="font-medium">{classDetails.instructor}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Confirmation #</span>
          <span className="font-mono text-primary">{confirmationId}</span>
        </div>
      </div>

      <div className="bg-accent/10 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your inbox. Please arrive 10 minutes before your class.
        </p>
      </div>

      <Button onClick={handleClose} className="w-full py-6 uppercase tracking-widest text-sm">
        Done
      </Button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-12">
          {renderStepIndicator()}
          {step === "details" && renderDetailsStep()}
          {step === "payment" && renderPaymentStep()}
          {step === "confirmation" && renderConfirmationStep()}
        </div>
      </div>
    </div>
  )
}
