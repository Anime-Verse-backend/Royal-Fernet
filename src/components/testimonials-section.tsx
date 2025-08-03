import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const testimonials = [
    {
        quote: "La calidad y el diseño de mi reloj superaron todas mis expectativas. Es una verdadera obra de arte en mi muñeca.",
        name: "Carlos Mendoza",
        title: "Cliente Verificado",
        image: "https://placehold.co/100x100.png"
    },
    {
        quote: "El servicio al cliente fue excepcional. Me guiaron en cada paso del proceso de compra con paciencia y profesionalismo.",
        name: "Sofía Vergara",
        title: "Compradora Frecuente",
        image: "https://placehold.co/100x100.png"
    },
    {
        quote: "Desde que compré mi primer Royal-Fernet, no he dejado de recibir cumplidos. Elegancia y precisión inigualables.",
        name: "Andrés Petro",
        title: "Coleccionista",
        image: "https://placehold.co/100x100.png"
    }
];

export function TestimonialsSection() {
    return (
        <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Lo Que Dicen Nuestros Clientes</h2>
                    <p className="text-muted-foreground mt-4">La satisfacción de nuestros clientes es nuestro mayor orgullo y la mejor carta de presentación.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="bg-background/50 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                            <CardContent className="flex-grow">
                                <p className="italic">"{testimonial.quote}"</p>
                            </CardContent>
                            <div className="mt-4">
                                <Avatar className="h-16 w-16 mx-auto mb-2">
                                    <AvatarImage src={testimonial.image} alt={testimonial.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
