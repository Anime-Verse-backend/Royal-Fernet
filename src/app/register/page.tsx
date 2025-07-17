/**
 * @fileoverview Página de registro de nuevos usuarios.
 * Proporciona un formulario para que los visitantes creen una nueva cuenta
 * en la tienda, utilizando Server Actions para manejar el proceso.
 */
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerUser } from '@/lib/actions';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>Create your account to start shopping.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerUser} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full mt-2">Create Account</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
