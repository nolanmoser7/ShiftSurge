import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  position: z.enum(["server", "bartender", "barback", "busser/foodrunner", "chef", "cook", "dishwasher", "host", "manager", "other"], {
    required_error: "Please select your position",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function WorkerSignupWithInvite() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inviteToken, setInviteToken] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
    }
  }, [search]);

  const { data: validation, isLoading: validating, error: validationError } = useQuery({
    queryKey: ["/api/invites/validate", inviteToken],
    queryFn: async () => {
      if (!inviteToken) return null;
      const res = await fetch(`/api/invites/validate/${inviteToken}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Invalid or expired invite");
      }
      return res.json();
    },
    enabled: !!inviteToken,
    retry: false,
  });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      position: undefined,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const res = await apiRequest("POST", "/api/auth/worker-signup-with-invite", {
        ...data,
        inviteToken,
      });
      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Account created successfully! Welcome to the team!",
      });

      // Set session and refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      // Redirect to worker feed
      setLocation("/worker-feed");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  if (!inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>No invite token provided</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please use a valid invite link to sign up.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-center text-muted-foreground">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationError || !validation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-invalid-invite">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>This invite link is not valid</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription data-testid="text-invite-error">
                {validationError?.message || "This invite has expired or is invalid. Please ask your manager for a new invite."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-chart-1/10">
      <Card className="max-w-md w-full" data-testid="card-worker-signup">
        <CardHeader>
          <CardTitle className="text-2xl">Join the Team</CardTitle>
          <CardDescription>
            You've been invited to join as a team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription data-testid="text-invite-valid">
                Valid staff invitation
              </AlertDescription>
            </Alert>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your full name"
                        {...field}
                        data-testid="input-worker-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-worker-position">
                          <SelectValue placeholder="Select your position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="server" data-testid="option-server">Server</SelectItem>
                        <SelectItem value="bartender" data-testid="option-bartender">Bartender</SelectItem>
                        <SelectItem value="barback" data-testid="option-barback">Barback</SelectItem>
                        <SelectItem value="busser/foodrunner" data-testid="option-busser">Busser/Food Runner</SelectItem>
                        <SelectItem value="chef" data-testid="option-chef">Chef</SelectItem>
                        <SelectItem value="cook" data-testid="option-cook">Cook</SelectItem>
                        <SelectItem value="dishwasher" data-testid="option-dishwasher">Dishwasher</SelectItem>
                        <SelectItem value="host" data-testid="option-host">Host</SelectItem>
                        <SelectItem value="manager" data-testid="option-manager">Manager</SelectItem>
                        <SelectItem value="other" data-testid="option-other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                        data-testid="input-worker-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-worker-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-worker-signup-submit"
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
