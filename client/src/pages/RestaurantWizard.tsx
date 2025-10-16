import { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, Search, MapPin, Loader2 } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "increase_table_turns", label: "Increase table turns in slow hours" },
  { value: "move_inventory", label: "Move inventory more efficiently" },
  { value: "improve_staff_benefits", label: "Improve staff benefits" },
  { value: "fill_more_seats", label: "Fill more seats" },
  { value: "increase_tips", label: "Increase tips for workers" },
] as const;

// Step 1 schema - only validate Place ID
const step1Schema = z.object({
  placeId: z.string().min(1, "Please search and select your restaurant"),
});

// Step 2 schema - validate employee limit and goals
const step2Schema = z.object({
  maxEmployees: z.coerce.number().min(1, "Please enter at least 1 employee").max(1000, "Maximum 1000 employees allowed"),
  goals: z.array(z.string()).min(1, "Please select at least one goal"),
});

// Combined schema for final submission
const wizardSchema = z.object({
  placeId: z.string().min(1, "Please search and select your restaurant"),
  maxEmployees: z.coerce.number().min(1, "Please enter at least 1 employee").max(1000, "Maximum 1000 employees allowed"),
  goals: z.array(z.string()).min(1, "Please select at least one goal"),
});

type WizardFormData = z.infer<typeof wizardSchema>;

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

export default function RestaurantWizard() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Search autocomplete state
  const [searchInput, setSearchInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<WizardFormData>({
    mode: "onChange",
    defaultValues: {
      placeId: "",
      maxEmployees: undefined,
      goals: [],
    },
  });


  // Debounced search effect
  useEffect(() => {
    if (!searchInput || searchInput.length < 3) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/restaurant/search-places?input=${encodeURIComponent(searchInput)}`);
        const data = await res.json();
        if (data.predictions) {
          setPredictions(data.predictions);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  const completeMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const payload = {
        placeId: data.placeId,
        maxEmployees: Number(data.maxEmployees),
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
    if (step === 1) {
      // Validate Step 1: Place ID
      const result = step1Schema.safeParse({ placeId: data.placeId });
      if (!result.success) {
        const error = result.error.errors[0];
        form.setError("placeId", {
          type: "manual",
          message: error.message
        });
        return;
      }
      // Move to step 2
      setStep(2);
    } else if (step === 2) {
      // Validate Step 2: Employee limit and goals
      const result = step2Schema.safeParse({ 
        maxEmployees: data.maxEmployees,
        goals: data.goals 
      });
      if (!result.success) {
        const error = result.error.errors[0];
        if (error.path[0] === 'maxEmployees') {
          form.setError("maxEmployees", {
            type: "manual",
            message: error.message
          });
        } else if (error.path[0] === 'goals') {
          form.setError("goals", {
            type: "manual",
            message: error.message
          });
        }
        return;
      }
      // Submit to backend
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
                    name="placeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Find Your Restaurant</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Start typing your restaurant name..."
                              value={selectedPlace ? selectedPlace.description : searchInput}
                              onChange={(e) => {
                                setSearchInput(e.target.value);
                                setSelectedPlace(null);
                                field.onChange("");
                              }}
                              data-testid="input-restaurant-search"
                              className="pl-9"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </FormControl>
                        
                        {/* Autocomplete dropdown */}
                        {predictions.length > 0 && !selectedPlace && (
                          <div className="mt-2 border rounded-md bg-popover p-2 space-y-1 shadow-md">
                            {predictions.map((prediction) => (
                              <button
                                key={prediction.placeId}
                                type="button"
                                onClick={() => {
                                  setSelectedPlace(prediction);
                                  setSearchInput("");
                                  setPredictions([]);
                                  field.onChange(prediction.placeId);
                                }}
                                className="w-full text-left p-2 hover-elevate active-elevate-2 rounded-sm flex items-start gap-2"
                                data-testid={`place-option-${prediction.placeId}`}
                              >
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{prediction.mainText || prediction.description}</div>
                                  {prediction.secondaryText && (
                                    <div className="text-sm text-muted-foreground truncate">{prediction.secondaryText}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <FormDescription>
                          Type your restaurant name and select it from the dropdown. We'll automatically get your address, phone, rating, and other details from Google.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedPlace && (
                    <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Selected Restaurant</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedPlace.description}</p>
                      </div>
                    </div>
                  )}
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
