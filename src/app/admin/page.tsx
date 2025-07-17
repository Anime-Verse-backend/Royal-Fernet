/**
 * @fileoverview Página de inicio de sesión para administradores.
 * Proporciona un formulario para que los usuarios con privilegios de administrador
 * accedan al panel de control, utilizando un Server Action para la autenticación.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginUser } from '@/lib/actions';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error de Autenticación</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const error = searchParams?.error;
  let errorMessage: string | undefined;
  
  if (error === 'InvalidCredentials') {
    errorMessage = 'Las credenciales proporcionadas son incorrectas.';
  } else if (error === 'ConnectionFailed') {
    errorMessage = 'No se pudo conectar al servidor. Inténtelo más tarde.';
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Enter credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginUser} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@royalfernet.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <ErrorMessage message={errorMessage} />
            <Button type="submit" className="w-full mt-2">Login</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="underline">
              Back to main site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}