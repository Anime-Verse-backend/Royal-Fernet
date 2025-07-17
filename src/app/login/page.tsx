/**
 * @fileoverview Página de inicio de sesión para usuarios generales.
 * Contiene un formulario para que los usuarios ingresen sus credenciales
 * y accedan a sus cuentas, utilizando Server Actions para la lógica de backend.
 */
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginUser } from '@/lib/actions'; // Assuming general user login is the same as admin for now

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginUser} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full mt-2">Login</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
           <div className="mt-2 text-center text-sm">
            Are you an admin?{" "}
            <Link href="/admin" className="underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
