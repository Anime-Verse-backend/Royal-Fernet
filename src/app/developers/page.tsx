import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Team - Royal-Fernet',
    description: 'Meet the talented team behind Royal-Fernet.',
};

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.52-1.29.372-.775.372-1.457.234-1.828-.156-.389-.42-.516-.6-.516h-.114zM16 2.098a13.91 13.91 0 00-13.908 13.909c0 4.38 2.016 8.33 5.303 10.942l-1.6 5.844 5.973-1.566c1.63.888 3.444 1.374 5.292 1.374a13.91 13.91 0 100-27.817z" />
    </svg>
  );

export default function DevelopersPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
              <h1 className="text-4xl font-bold font-headline tracking-tight sm:text-5xl lg:text-6xl">Nuestro Equipo</h1>
              <p className="mt-4 text-xl text-muted-foreground">Conoce a las personas que hacen posible PEPS.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <Card className="flex flex-col items-center p-8 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <Avatar className="h-32 w-32 mb-6">
                      <AvatarImage src="https://i.pinimg.com/736x/14/d8/98/14d8985abd22eb6005b1262ba6de08a6.jpg" data-ai-hint="person portrait" alt="Developer 1" />
                      <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-semibold">Luis Miguel Fonce</h1>
                  
                  <p className="text-primary/80">Lead Full-Stack Developer</p>
                  <p className="mt-4 text-sm text-muted-foreground flex-grow">Apasionado por crear experiencias de usuario fluidas y eficientes desde el frontend hasta el backend.</p>
                  <div className="flex gap-4 mt-6">
                      <Link href="https://api.whatsapp.com/send/?phone=573044065668&text=%C2%A1Hola,+Me+interesa+tu+trabajo+amigo" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-6 w-6" /></Link>
                      <Link href="https://www.instagram.com/miguel_1068l/" aria-label="Instagram Profile" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
                      <Link href="https://www.facebook.com/luismiguel.fonceguaitero?locale=es_LA" aria-label="Facebook Profile" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></Link>
                      <Link href="https://github.com/MIGUEL6-BNX" aria-label="Github Profile" className="text-muted-foreground hover:text-primary"><Github className="h-6 w-6" /></Link>
                  </div>
              </Card>
              <Card className="flex flex-col items-center p-8 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <Avatar className="h-32 w-32 mb-6">
                      <AvatarImage src="https://i.pinimg.com/736x/3d/cc/f3/3dccf36fc2395f71d4543ccd176d11c8.jpg" data-ai-hint="person portrait" alt="Developer 1" />
                      <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-semibold">Omar payares</h1>
                  
                  <p className="text-primary/80">Lead Full-Stack Developer</p>
                  <p className="mt-4 text-sm text-muted-foreground flex-grow">Apasionado por crear experiencias de usuario fluidas y eficientes desde el frontend hasta el backend.</p>
                  <div className="flex gap-4 mt-6">
                      <Link href="https://api.whatsapp.com/send/?phone=573044065668&text=%C2%A1Hola,+Me+interesa+tu+trabajo+amigo" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-6 w-6" /></Link>
                      <Link href="https://www.instagram.com/miguel_1068l/" aria-label="Instagram Profile" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
                      <Link href="https://www.facebook.com/luismiguel.fonceguaitero?locale=es_LA" aria-label="Facebook Profile" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></Link>
                      <Link href="https://github.com/MIGUEL6-BNX" aria-label="Github Profile" className="text-muted-foreground hover:text-primary"><Github className="h-6 w-6" /></Link>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}
