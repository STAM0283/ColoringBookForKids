import type {Metadata} from "next";
import {HomePage} from "@/components/public/home-page";

export const metadata:Metadata={title:"Creative coloring books for children",description:"Heartwarming coloring books and free printable activities for children.",alternates:{canonical:"/en",languages:{fr:"/",en:"/en"}},openGraph:{locale:"en_GB",url:"/en"}};
export default function EnglishHomePage(){return <HomePage locale="en"/>}
