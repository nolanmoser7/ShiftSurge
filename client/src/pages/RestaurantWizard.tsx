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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const wizardSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  neighborhoodId: z.string().min(1, "Please select a neighborhood"),
  lat: z.string().optional(),
  lng: z.string().optional(),
  address: z.string().optional(),
  staffMin: z.number().int().positive().optional(),
  staffMax: z.number().int().positive().optional(),
}).refine((data) => {
  if (data.staffMin && data.staffMax) {
    return data.staffMax >= data.staffMin;
  }
  return true;
}, {
  message: "Max staff must be greater than or equal to min staff",
  path: ["staffMax"],
});

type WizardFormData = z.infer<typeof wizardSchema>;

export default function RestaurantWizard() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      restaurantName: "",
      neighborhoodId: "",
      lat: "",
      lng: "",
      address: "",
      staffMin: undefined,
      staffMax: undefined,
    },
  });

  const { data: neighborhoods, isLoading: loadingNeighborhoods } = useQuery({
    queryKey: ["/api/restaurant/neighborhoods"],
  });

  const completeMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const payload = {
        restaurantName: data.restaurantName,
        neighborhoodId: data.neighborhoodId,
        lat: data.lat || undefined,
        lng: data.lng || undefined,
        address: data.address || undefined,
        staffMin: data.staffMin || undefined,
        staffMax: data.staffMax || undefined,
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
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeMutation.mutate(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const progress = (step / 3) * 100;

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
          <CardDescription>Step {step} of 3</CardDescription>
          <Progress value={progress} className="mt-2" data-testid="progress-wizard" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="restaurantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your restaurant name"
                            {...field}
                            data-testid="input-restaurant-name"
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed to workers browsing promotions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="neighborhoodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingNeighborhoods}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-neighborhood">
                              <SelectValue placeholder="Select a neighborhood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(neighborhoods) && neighborhoods.map((neighborhood: any) => (
                              <SelectItem key={neighborhood.id} value={neighborhood.id}>
                                {neighborhood.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the neighborhood where your restaurant is located
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State"
                            {...field}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="40.7128"
                              {...field}
                              data-testid="input-latitude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="-74.0060"
                              {...field}
                              data-testid="input-longitude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="staffMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Staff (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-staff-min"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of staff during slow hours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="staffMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Staff (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="20"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-staff-max"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of staff during peak hours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                  ) : step === 3 ? (
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
