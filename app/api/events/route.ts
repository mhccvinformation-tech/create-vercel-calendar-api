import { NextResponse } from "next/server"

// Public, read-only calendar data — safe to expose to any origin (e.g. a Squarespace site).
// Override with ALLOWED_ORIGIN if you want to lock it down to a specific domain.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*"
const TIME_ZONE = "America/Los_Angeles"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

export const dynamic = "force-dynamic"

type GoogleEvent = {
  id: string
  summary?: string
  description?: string
  location?: string
  htmlLink?: string
  status?: string
  start?: { date?: string; dateTime?: string; timeZone?: string }
  end?: { date?: string; dateTime?: string; timeZone?: string }
}

/**
 * Converts a wall-clock time in a given IANA time zone to the corresponding UTC Date.
 * Accounts for the zone's DST offset on that specific date.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month, day, 0, 0, 0)
  const asUtc = new Date(utcGuess)
  const tzString = asUtc.toLocaleString("en-US", { timeZone })
  const offset = new Date(tzString).getTime() - new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime()
  return new Date(utcGuess - offset)
}

/** Returns [start, endExclusive] UTC instants bounding the current month in the given time zone. */
function currentMonthRange(timeZone: string): { timeMin: Date; timeMax: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date())

  const year = Number(parts.find((p) => p.type === "year")?.value)
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1 // 0-indexed

  const timeMin = zonedWallTimeToUtc(year, month, 1, timeZone)
  const timeMax = zonedWallTimeToUtc(year, month + 1, 1, timeZone)
  return { timeMin, timeMax }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY

  if (!calendarId || !apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_CALENDAR_ID or GOOGLE_CALENDAR_API_KEY environment variable." },
      { status: 500, headers: CORS_HEADERS },
    )
  }

  const { timeMin, timeMax } = currentMonthRange(TIME_ZONE)

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
  )
  url.searchParams.set("key", apiKey)
  url.searchParams.set("timeMin", timeMin.toISOString())
  url.searchParams.set("timeMax", timeMax.toISOString())
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("timeZone", TIME_ZONE)
  url.searchParams.set("maxResults", "250")

  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json(
      { error: "Failed to fetch calendar events.", status: res.status, detail },
      { status: 502, headers: CORS_HEADERS },
    )
  }

  const data = (await res.json()) as { items?: GoogleEvent[] }
  const items = data.items ?? []

  const events = items
    .filter((event) => event.status !== "cancelled")
    .map((event) => ({
      id: event.id,
      title: event.summary ?? "(No title)",
      description: event.description ?? null,
      location: event.location ?? null,
      link: event.htmlLink ?? null,
      allDay: Boolean(event.start?.date),
      start: event.start?.dateTime ?? event.start?.date ?? null,
      end: event.end?.dateTime ?? event.end?.date ?? null,
    }))

  return NextResponse.json(
    {
      timeZone: TIME_ZONE,
      monthStart: timeMin.toISOString(),
      monthEnd: timeMax.toISOString(),
      count: events.length,
      events,
    },
    { headers: CORS_HEADERS },
  )
}
