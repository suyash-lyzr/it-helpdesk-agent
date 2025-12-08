import { NextRequest, NextResponse } from "next/server"
import { getForecast } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7", 10)

    const forecastData = getForecast(days)

    return NextResponse.json({
      success: true,
      data: forecastData,
      note: "This is mocked forecast data for demonstration purposes",
    })
  } catch (error) {
    console.error("Error fetching forecast:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch forecast data",
      },
      { status: 500 }
    )
  }
}

