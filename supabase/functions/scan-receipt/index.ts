// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/genai";

function withCors(res: Response) {
	const headers = new Headers(res.headers);
	// Allow your development server origin
	headers.set("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
	headers.set("Access-Control-Max-Age", "86400"); // 24 hours
	return new Response(res.body, { 
	  ...res, 
	  headers 
	});
  }

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

import { GoogleGenerativeAI } from "@google/genai";

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
	  return new Response(null, {
		status: 204,
		headers: {
		  "Access-Control-Allow-Origin": "*",
		  "Access-Control-Allow-Methods": "POST, OPTIONS",
		  "Access-Control-Allow-Headers": "*",
		  "Access-Control-Max-Age": "86400"
		}
	  });
	}
  
	try {
	  const { image } = await req.json();
	  const apiKey = Deno.env.get("GEMINI_API_KEY");
  
	  if (!apiKey) {
		throw new Error("API key not configured");
	  }
  
	  const payload = {
		contents: [{
		  parts: [
			{ text: `Analyze this receipt and extract all items and their prices.
        	Format your response ONLY as a JSON array of objects, each with 'item', 'amount' (default value of 1 if no amount is displayed), and 'price' fields.
        	Example format: [{"item": "Burger", "amount": 2, "price": 24.99}, {"item": "Fries", "amount": 1, "price": 4.99}]
        	Do not include any other text or explanation in your response.` },
			{ inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } }
		  ]
		}]
	  };
  
	  const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
		{
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
		  },
		  body: JSON.stringify(payload)
		}
	  );
  
	  if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Gemini API error: ${errorText}`);
	  }
  
	  const result = await response.json();
	  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
	  if (!text) {
		throw new Error("No response from Gemini API");
	  }
  
	  // Try to parse the response as JSON
	  try {
		const parsedItems = JSON.parse(text);
		return new Response(JSON.stringify({ items: parsedItems }), {
		  headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "*"
		  }
		});
	  } catch (parseError) {
		// If direct parsing fails, try to extract JSON array
		const jsonMatch = text.match(/\[(.*?)\]/s);
		if (jsonMatch) {
		  const parsedItems = JSON.parse(jsonMatch[0]);
		  return new Response(JSON.stringify({ items: parsedItems }), {
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*",
			  "Access-Control-Allow-Methods": "POST, OPTIONS",
			  "Access-Control-Allow-Headers": "*"
			}
		  });
		}
		throw new Error("Failed to parse response from Gemini API");
	  }
  
	} catch (error) {
	  return new Response(
		JSON.stringify({ error: error.message }),
		{
		  status: 500,
		  headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "*"
		  }
		}
	  );
	}
  });