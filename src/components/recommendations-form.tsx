"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Loader, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRecommendationsAction } from "@/actions/get-recommendations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
 Card,
 CardContent,
 CardDescription,
 CardFooter,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "./ui/badge";

export function RecommendationsForm() {
 const [isPending, startTransition] = useTransition();
 const [error, setError] = useState<string | null>(null);
 const [recommendations, setRecommendations] = useState<string[] | null>(null);

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError(null);
  setRecommendations(null);
  const formData = new FormData(event.currentTarget);
  const interests = formData.get("interests") as string;
  const profileInformation = formData.get("profileInformation") as string;

  startTransition(async () => {
   const result = await getRecommendationsAction({
    interests,
    profileInformation,
   });

   if (result.success) {
    setRecommendations(result.data ?? null);
   } else {
    setError(result.error ?? null);
   }
  });
 };

 return (
  <div className="space-y-4">
   <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
     <Input
      name="interests"
      placeholder="Your interests (e.g., sci-fi books, hiking, indie music)"
      required
      disabled={isPending}
     />
     <Textarea
      name="profileInformation"
      placeholder="A bit about you (e.g., 'A software developer who loves cats and photography')"
      className="md:col-span-1"
      required
      disabled={isPending}
     />
    </div>
    <Button type="submit" disabled={isPending}>
     {isPending ? (
      <>
       <Loader className="mr-2 h-4 w-4 animate-spin" />
       Getting Recommendations...
      </>
     ) : (
      <>
       <Lightbulb className="mr-2 h-4 w-4" />
       Get Recommendations
      </>
     )}
    </Button>
   </form>

   {error && (
    <Alert variant="destructive">
     <AlertTriangle className="h-4 w-4" />
     <AlertTitle>Error</AlertTitle>
     <AlertDescription>{error}</AlertDescription>
    </Alert>
   )}

   {recommendations && (
    <Card className="bg-secondary/50">
     <CardHeader>
      <CardTitle className="font-sans">Rooms For You</CardTitle>
      <CardDescription>
       Based on your interests, we think you'll love these rooms!
      </CardDescription>
     </CardHeader>
     <CardContent>
      <div className="flex flex-wrap gap-2">
       {recommendations.map((rec, index) => (
        <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
         {rec}
        </Badge>
       ))}
      </div>
     </CardContent>
    </Card>
   )}
  </div>
 );
}
