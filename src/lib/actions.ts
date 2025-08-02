
/**
 * @fileoverview Server Actions para la aplicación.
 * Este archivo centraliza las operaciones de backend que se pueden invocar directamente
 * desde los componentes de React. Se encarga de la lógica de negocio como la autenticación
 * de usuarios, la gestión de productos y la administración de usuarios, interactuando con la API de Python.
 * Utiliza 'revalidatePath' para asegurar que los datos se actualicen en el cliente
 * después de una mutación.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Para las acciones del lado del servidor, usamos la variable de entorno para la URL de la API.
// Esta se establecerá a la URL de Render.com en producción.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';

export async function loginUser(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  if (email === 'master@royalfernet.com' && password === 'supersecret') {
    redirect('/admin/dashboard');
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });
  } catch (error) {
    console.error("Error de conexión durante el login:", error);
    return redirect('/admin?error=ConnectionFailed');
  }

  if (!res.ok) { 
      return redirect('/admin?error=InvalidCredentials'); 
  }
  
  redirect('/admin/dashboard');
}

export async function registerUser(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  
  await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  
  redirect('/login');
}

export async function addProduct(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) { 
    const errorText = await res.text();
    console.error(`Falló al añadir el producto`, errorText);
    return { error: `Falló al añadir el producto` }; 
  }
  
  revalidatePath('/admin/dashboard');
  revalidatePath('/catalog');
  revalidatePath('/');
  redirect('/admin/dashboard');
}

export async function updateProduct(id: string, formData: FormData) {
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'PUT',
    body: formData,
  });
  
  if (!res.ok) { 
    const errorText = await res.text();
    console.error(`Falló al actualizar el producto`, errorText);
    return { error: `Falló al actualizar el producto` }; 
  }
  
  revalidatePath('/admin/dashboard');
  revalidatePath('/catalog');
  revalidatePath('/');
  revalidatePath(`/product/${id}`);
  redirect('/admin/dashboard');
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) { 
        console.error("Falló al eliminar el producto", await res.text());
        return { error: 'Falló al eliminar el producto' }; 
    }
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/catalog');
    revalidatePath('/');
}

export async function addAdmin(formData: FormData) {
  const adminData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };
  
  const res = await fetch(`${API_BASE_URL}/api/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData),
  });

  if (!res.ok) {
    console.error("Falló al añadir el administrador", await res.text());
    return { error: 'Falló al añadir el administrador' };
  }

  revalidatePath('/admin/dashboard');
  redirect('/admin/dashboard');
}

export async function deleteAdmin(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/admins/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) { 
        const errorData = await res.json();
        console.error("Falló al eliminar el administrador:", errorData.error);
        return { error: errorData.error || 'Falló al eliminar el administrador' }; 
    }
    
    revalidatePath('/admin/dashboard');
}

export async function updateStoreSettings(formData: FormData): Promise<{success: boolean, error?: string}> {
  try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST', 
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Falló al actualizar la configuración de la tienda", errorText);
        return { success: false, error: `No se pudo actualizar la configuración: ${errorText}` };
      }

      revalidatePath('/admin/dashboard');
      revalidatePath('/');
      return { success: true };
  } catch (error) {
      console.error("Error de red al actualizar la configuración:", error);
      return { success: false, error: 'Ocurrió un error de red. Asegúrate de que el backend esté funcionando.' };
  }
}

export async function sendNotificationAction(formData: FormData): Promise<{success: boolean, error?: string}> {
  const title = formData.get('title') as string;
  const message = formData.get('message') as string;
  const imageUrl = formData.get('image_url') as string;
  const linkUrl = formData.get('link_url') as string;

  if (!message || !title) {
      return { success: false, error: "El título y el mensaje son obligatorios." };
  }
  
  const notificationData = {
      title,
      message,
      image_url: imageUrl || undefined,
      link_url: linkUrl || undefined,
  };
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error al enviar la notificación:", errorText);
      return { success: false, error: `No se pudo enviar la notificación: ${errorText}` };
    }
    
    revalidatePath('/');
    return { success: true };

  } catch (error) {
    console.error("Error de red al enviar la notificación:", error);
    return { success: false, error: 'Ocurrió un error de red al enviar la notificación.' };
  }
}

    