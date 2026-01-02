"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { format } from "date-fns";

type CardPreviewProps = {
  name: string;
  listName?: string;
  startDate?: string;
  deadline?: string;
  latitude?: number;
  longitude?: number;
};

export function CardPreview({
  name,
  listName,
  startDate,
  deadline,
  latitude,
  longitude,
}: CardPreviewProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{name}</CardTitle>
        {listName && (
          <Badge variant="secondary" className="w-fit">
            {listName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {startDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Start: {format(new Date(startDate), "MMM dd, yyyy")}
            </span>
          </div>
        )}
        {deadline && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Deadline: {format(new Date(deadline), "MMM dd, yyyy")}
            </span>
          </div>
        )}
        {latitude !== undefined && longitude !== undefined && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>
              Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
