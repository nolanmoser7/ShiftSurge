import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "increase_table_turns", label: "Increase table turns in slow hours" },
  { value: "move_inventory", label: "Move inventory more efficiently" },
  { value: "improve_staff_benefits", label: "Improve staff benefits" },
  { value: "fill_more_seats", label: "Fill more seats" },
  { value: "increase_tips", label: "Increase tips for workers" },
] as const;

const wizardSchema = z.object({
  googleBusinessLink: z.string().min(1, "Please provide your Google Business link").url("Please enter a valid URL"),
  maxEmployees: z.coerce.number().min(1, "Please enter at least 1 employee").max(1000, "Maximum 1000 employees allowed"),
  goals: z.array(z.string()),
});

type WizardFormData = z.infer<typeof wizardSchema>;

export default function RestaurantWizard() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: "onChange",
    defaultValues: {
      googleBusinessLink: "",
      maxEmployees: undefined,
      goals: [],
    },
  });


  const completeMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const payload = {
        googleBusinessLink: data.googleBusinessLink,
        maxEmployees: data.maxEmployees,
        goals: data.goals,
      };
      const res = await apiRequest("POST", "/api/restaurant/complete-wizard", payload);
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/wizard-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WizardFormData) => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Validate step 2 fields
      if (data.goals.length === 0) {
        form.setError("goals", {
          type: "manual",
          message: "Please select at least one goal"
        });
        return;
      }
      if (!data.maxEmployees || data.maxEmployees < 1) {
        form.setError("maxEmployees", {
          type: "manual",
          message: "Please enter a valid number of employees"
        });
        return;
      }
      completeMutation.mutate(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const progress = (step / 2) * 100;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-chart-1/10">
        <Card className="max-w-2xl w-full" data-testid="card-wizard-success">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Setup Complete!</CardTitle>
            <CardDescription className="text-lg">
              Your restaurant profile has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              You're all set to start creating promotions and connecting with hospitality workers!
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/restaurant-dashboard")}
                data-testid="button-view-dashboard"
                className="w-full"
              >
                View Dashboard
              </Button>
              <Button
                onClick={() => setLocation("/restaurant-dashboard")}
                data-testid="button-create-promotion"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create First Promotion
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/restaurant-dashboard")}
                data-testid="button-generate-staff-invite"
                className="w-full"
              >
                Generate Staff Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-chart-1/10">
      <Card className="max-w-2xl w-full" data-testid="card-restaurant-wizard">
        <CardHeader>
          <CardTitle className="text-2xl">Restaurant Setup</CardTitle>
          <CardDescription>Step {step} of 2</CardDescription>
          <Progress value={progress} className="mt-2" data-testid="progress-wizard" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="googleBusinessLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Business Link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://maps.google.com/..."
                            {...field}
                            data-testid="input-google-business-link"
                          />
                        </FormControl>
                        <FormDescription>
                          Paste your restaurant's Google Maps or Google Business link. We'll automatically extract your address, phone, rating, and other details.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">How to find your Google Business link:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Search for your restaurant on Google Maps</li>
                      <li>Click the "Share" button</li>
                      <li>Copy the link and paste it above</li>
                    </ol>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="maxEmployees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Number of Employees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 25"
                            {...field}
                            data-testid="input-max-employees"
                          />
                        </FormControl>
                        <FormDescription>
                          What is the maximum number of employees you will onboard to Shift Surge? (We'll allow up to 5 additional for flexibility)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">What are your goals for using Shift Surge?</FormLabel>
                          <FormDescription>
                            Select all that apply to help us personalize your experience
                          </FormDescription>
                        </div>
                        <div className="space-y-3">
                          {GOAL_OPTIONS.map((goal) => (
                            <FormField
                              key={goal.value}
                              control={form.control}
                              name="goals"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={goal.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(goal.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, goal.value])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== goal.value
                                                )
                                              )
                                        }}
                                        data-testid={`checkbox-goal-${goal.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {goal.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    data-testid="button-wizard-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  disabled={completeMutation.isPending}
                  data-testid="button-wizard-next"
                >
                  {completeMutation.isPending ? (
                    "Completing..."
                  ) : step === 2 ? (
                    "Complete Setup"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
