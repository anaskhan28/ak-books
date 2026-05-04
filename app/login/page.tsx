"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth/client";
import { AUTHORIZED_EMAILS } from "@/lib/auth/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, ShieldCheck, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!AUTHORIZED_EMAILS.some(e => e.toLowerCase() === email.toLowerCase())) {
      toast.error("Access Denied", {
        description: "This application is restricted to authorized personnel only.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        toast.error("Failed to send OTP", {
          description: error.message || "Please try again later.",
        });
      } else {
        toast.success("OTP Sent", {
          description: `A verification code has been sent to ${email}`,
        });
        setStep("otp");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 6) {
      toast.error("Invalid Code", {
        description: "Please enter the full 6-digit verification code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (error) {
        toast.error("Authentication Failed", {
          description: error.message || "The code you entered is incorrect or expired.",
        });
      } else {
        toast.success("Welcome back", {
          description: "Successfully signed in to AK Books.",
        });
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fcfcfc] font-sans relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] px-4 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center mb-4 group transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <Image
              src="/ak-enterprise-logo.png"
              alt="AK Books Logo"
              width={40}
              height={40}
              className="group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AK Books</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Operations & CRM</p>
        </div>

        <Card className="border-border shadow-2xl shadow-primary/5 bg-white overflow-hidden rounded-2xl">
          <div className="h-1.5 w-full bg-primary/10 relative">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: step === "email" ? "50%" : "100%" }}
            />
          </div>

          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              {step === "email" ? (
                <>
                  <Lock className="w-5 h-5 text-primary" />
                  Authorized Access
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Verify Identity
                </>
              )}
            </CardTitle>
            <CardDescription className="text-[13px]">
              {step === "email"
                ? "Enter your authorized email to receive a secure login code to proceed."
                : `We've sent a 6-digit code to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Official Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@akenterprise.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11  border-border focus:ring-primary/20 focus:border-primary rounded-xl transition-all"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-4 flex flex-col items-center">
                  <Label htmlFor="otp" className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider self-start">
                    Verification Code
                  </Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                      <InputOTPSlot index={1} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                      <InputOTPSlot index={2} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={3} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                      <InputOTPSlot index={4} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                      <InputOTPSlot index={5} className="w-12 h-14 text-lg font-semibold rounded-xl border-border " />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium"
                  disabled={isLoading}
                >
                  Use a different email
                </button>
              </form>
            )}
          </CardContent>

          {/* <CardFooter className=" border-t border-border/50 px-6 py-4">
            <p className="text-[11px] text-muted-foreground text-center w-full">
              Protected by Neon Auth. High-security environment.
            </p>
          </CardFooter> */}
        </Card>

        <p className="text-center mt-8 text-[12px] text-muted-foreground font-medium">
          &copy; 2026 AK Enterprise Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
