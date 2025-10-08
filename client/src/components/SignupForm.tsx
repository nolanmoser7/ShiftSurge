import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"worker" | "restaurant">("worker");
  const [name, setName] = useState("");
  const [workerRole, setWorkerRole] = useState("server");
  const [address, setAddress] = useState("");
  const { signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({
        email,
        password,
        role,
        name,
        ...(role === "worker" ? { workerRole } : { address }),
      });
      toast({ title: "Success", description: "Account created successfully" });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-display font-semibold mb-6">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">I am a...</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "worker" | "restaurant")}>
            <SelectTrigger id="role" data-testid="select-signup-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="restaurant">Restaurant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-signup-email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            data-testid="input-signup-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">{role === "worker" ? "Name" : "Restaurant Name"}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            data-testid="input-signup-name"
          />
        </div>
        {role === "worker" ? (
          <div className="space-y-2">
            <Label htmlFor="workerRole">Role</Label>
            <Select value={workerRole} onValueChange={setWorkerRole}>
              <SelectTrigger id="workerRole" data-testid="select-worker-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="bartender">Bartender</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-restaurant-address"
            />
          </div>
        )}
        <Button type="submit" className="w-full" data-testid="button-signup-submit">
          Sign Up
        </Button>
      </form>
    </Card>
  );
}
