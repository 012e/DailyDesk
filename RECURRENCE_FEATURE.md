# Recurring Cards Feature Implementation

## Overview
Added comprehensive recurring card functionality to DailyDesk, allowing cards to automatically recur based on various patterns.

## Recurrence Patterns Supported

1. **Never** - No recurrence (default)
2. **Daily (Monday to Friday)** - Repeats every weekday, skips weekends
3. **Weekly** - Repeats every 7 days
4. **Monthly on due date** - Repeats on the same date each month (e.g., 15th of every month)
5. **Monthly on specific day** - Repeats on a specific ordinal weekday (e.g., 2nd Sunday of every month)

## Changes Made

### Backend Changes

#### 1. Database Schema (`backend/src/lib/db/schema.ts`)
Added three new columns to the `cardsTable`:
- `recurrence`: TEXT - Stores the recurrence type
- `recurrenceDay`: INTEGER - For monthly_day pattern (1-5 for 1st-5th)
- `recurrenceWeekday`: INTEGER - For monthly_day pattern (0=Sunday to 6=Saturday)

#### 2. Migration File (`backend/drizzle/0003_add_recurrence_to_cards.sql`)
SQL migration to add the new columns to existing databases.

#### 3. Card Types (`backend/src/types/cards.ts`)
Updated `CardSchema` and `CreateCardSchema` to include:
- `recurrence`: Enum with allowed values
- `recurrenceDay`: Number (1-5)
- `recurrenceWeekday`: Number (0-6)

#### 4. Card Service (`backend/src/services/cards.service.ts`)
Updated service functions to handle recurrence fields:
- `getCardsForBoard()`: Returns recurrence fields
- `createCard()`: Saves recurrence fields
- `updateCard()`: Updates recurrence fields

### Frontend Changes

#### 1. Card Types (`frontend/src/types/card.ts`)
Added `RecurrenceType` type and updated `Card` interface with recurrence fields.

#### 2. Recurrence Component (`frontend/src/components/card-edit-dialog/card-recurrence.tsx`)
New component providing:
- Combobox/Select for choosing recurrence pattern
- Additional selects for ordinal (1st-5th) and weekday when "Monthly on specific day" is selected
- Clear labeling and user-friendly interface
- Badge display showing current recurrence setting

#### 3. Card Dates Component Updates (`frontend/src/components/card-edit-dialog/card-dates.tsx`)
The existing component now works alongside the recurrence component.

#### 4. Card Edit Dialog (`frontend/src/components/card-edit-dialog/card-edit-dialog.tsx`)
- Imported `CardRecurrence` component and `Repeat` icon
- Added recurrence button in the action buttons row

#### 5. Card Create Dialog (`frontend/src/components/card-edit-dialog/card-create-dialog.tsx`)
- Added `CardRecurrence` component to new card creation flow
- Users can set recurrence when creating cards

#### 6. Kanban Card Display (`frontend/src/pages/kanban/KanbanCard.tsx`)
- Shows recurrence badge on cards in the kanban board
- Badge displays short label (Daily, Weekly, Monthly)
- Includes Repeat icon for visual clarity

#### 7. Recurrence Utilities (`frontend/src/lib/recurrence-utils.ts`)
Helper functions for working with recurrence:
- `calculateNextDueDate()`: Calculates the next occurrence based on pattern
- `formatRecurrence()`: Formats recurrence as human-readable text
- `getRecurrenceShortLabel()`: Returns short label for badges
- `findNthWeekdayInMonth()`: Helper for monthly_day pattern

## Usage Instructions

### Setting Up Recurrence

1. **Open a card** in edit mode
2. **Click the "Recurrence" button** in the action buttons area
3. **Select a recurrence pattern** from the dropdown:
   - Never (default)
   - Daily (Monday to Friday)
   - Weekly
   - Monthly on due date
   - Monthly on specific day

4. **For "Monthly on specific day"**:
   - Select the ordinal (1st, 2nd, 3rd, 4th, 5th)
   - Select the day of week (Sunday through Saturday)
   - Example: "2nd Sunday" will repeat on the 2nd Sunday of every month

5. **Click "Save"** to apply the recurrence

### Viewing Recurrence

- Cards with recurrence show a badge with the pattern
- In the kanban board, cards display a "Repeat" icon with the pattern label
- In the card edit dialog, the current recurrence is shown with an "Edit" button

## Technical Details

### Date Calculation Logic

The `calculateNextDueDate()` function handles all recurrence patterns:

- **Daily Weekdays**: Adds 1 day, skips to Monday if landing on weekend
- **Weekly**: Adds exactly 7 days
- **Monthly Date**: Uses `addMonths()` to maintain the same date
- **Monthly Day**: Finds the nth occurrence of a specific weekday in the target month

### Data Flow

1. User selects recurrence pattern in UI
2. Frontend sends recurrence data to backend API
3. Backend validates and stores in database
4. When cards are fetched, recurrence data is included
5. Frontend displays recurrence badges and allows editing

## Database Migration

To apply the migration, run:

```bash
cd backend
# For SQLite
sqlite3 path/to/database.db < drizzle/0003_add_recurrence_to_cards.sql

# Or use Drizzle migration tools
npx drizzle-kit push
```

## Future Enhancements

Potential features to add:
- Automatic card creation on recurrence (background job)
- Custom recurrence patterns (every N days/weeks/months)
- Recurrence end date
- Skip occurrences
- Notifications for recurring card due dates
- History of recurring card instances

## Files Modified

### Backend
- `backend/src/lib/db/schema.ts`
- `backend/src/types/cards.ts`
- `backend/src/services/cards.service.ts`
- `backend/drizzle/0003_add_recurrence_to_cards.sql` (new)

### Frontend
- `frontend/src/types/card.ts`
- `frontend/src/components/card-edit-dialog/card-recurrence.tsx` (new)
- `frontend/src/components/card-edit-dialog/card-edit-dialog.tsx`
- `frontend/src/components/card-edit-dialog/card-create-dialog.tsx`
- `frontend/src/pages/kanban/KanbanCard.tsx`
- `frontend/src/lib/recurrence-utils.ts` (new)
