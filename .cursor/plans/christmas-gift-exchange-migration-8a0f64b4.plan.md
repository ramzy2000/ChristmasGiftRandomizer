<!-- 8a0f64b4-bdae-4ee6-ae1c-b6e224ba67e0 2f4c3701-b652-4d25-b7a5-5f94b9bce939 -->
# Christmas Gift Exchange Application - Implementation Plan

## Overview

Transform the existing jQuery-based client-side application into a production-ready ASP.NET Core MVC application with authentication, database persistence, email notifications, and reusable participant groups.

## Current State Analysis

- **Old Project**: jQuery-based, client-side only, flawed matching algorithm (infinite loop risk), requires even number of participants, uses Bootstrap with #DF7861 primary color
- **New Project**: Basic ASP.NET Core MVC template (.NET 10.0), no dependencies configured, standard Bootstrap included

## Implementation Plan

### Phase 1: Project Setup & Infrastructure

**1.1 Update .csproj with Required Packages**

- Add NuGet packages: Npgsql.EntityFrameworkCore.PostgreSQL, Microsoft.AspNetCore.Identity.EntityFrameworkCore, MailKit, Hangfire.Core, Hangfire.AspNetCore, Serilog.AspNetCore (optional)
- Update to Bootstrap 5.3+ via CDN or libman

**1.2 Configure Database Connection**

- Update `appsettings.json` with PostgreSQL connection string
- Add EmailSettings and AppSettings configuration sections
- Create `appsettings.Development.json` with local dev settings

**1.3 Project Structure**
Create new folders:

- `Data/` - DbContext and migrations
- `Services/` - Business logic services (MatchingService, EmailService)
- `ViewModels/` - Data transfer objects
- `Extensions/` - Helper extensions

**1.4 Database Context Setup**

- Create `ApplicationDbContext.cs` in `Data/` folder
- Configure PostgreSQL provider in `Program.cs`
- Set up Entity Framework Core with connection string

### Phase 2: Identity & User Management

**2.1 Extend IdentityUser**

- Create `ApplicationUser.cs` in `Models/` extending IdentityUser
- Add properties: FirstName, LastName, CreatedAt

**2.2 Configure Identity**

- Update `ApplicationDbContext` to use ApplicationUser
- Configure Identity services in `Program.cs` with options
- Add Identity UI scaffolding (or create custom views)

**2.3 Create Identity Views**

- `Views/Account/Register.cshtml` - Registration form
- `Views/Account/Login.cshtml` - Login form
- `Views/Account/ForgotPassword.cshtml` - Password reset
- `Views/Account/Profile.cshtml` - User profile page

**2.4 Create AccountController**

- `Controllers/AccountController.cs` with Register, Login, Logout, Profile actions
- Implement email verification flow (optional, configurable)

### Phase 3: Database Models & Migrations

**3.1 Create Entity Models**

- `Models/Group.cs` - Participant groups (Id, Name, Description, OrganizerId, CreatedAt)
- `Models/Participant.cs` - Group participants (Id, GroupId, UserId, Email, Name, RestrictionsJson, CreatedAt)
- `Models/Exchange.cs` - Gift exchanges (Id, GroupId, Year, Name, Status enum, EventDate, CreatedAt, MatchedAt)
- `Models/Restriction.cs` - Exchange restrictions (Id, ExchangeId, GiverId, CannotGiveToId, Reason)
- `Models/Assignment.cs` - Match assignments (Id, ExchangeId, GiverId, ReceiverId, NotifiedAt, CreatedAt)
- `Models/PreviousMatch.cs` - Historical matches (Id, ExchangeId, GiverId, ReceiverId, Year)

**3.2 Configure Entity Relationships**

- Set up foreign keys and navigation properties in `ApplicationDbContext`
- Configure JSON column for RestrictionsJson in Participant
- Add indexes for performance

**3.3 Create Initial Migration**

- Run `dotnet ef migrations add InitialCreate`
- Review migration file
- Create seed data method for optional admin user

### Phase 4: Group Management

**4.1 Create GroupsController**

- `Controllers/GroupsController.cs` with CRUD operations
- Actions: Index (list user's groups), Create, Edit, Delete, Details
- Implement authorization (users can only manage their own groups)

**4.2 Create Group ViewModels**

- `ViewModels/GroupViewModel.cs` - For create/edit forms
- `ViewModels/GroupDetailsViewModel.cs` - For details view with participants

**4.3 Create Group Views**

- `Views/Groups/Index.cshtml` - List all groups with actions
- `Views/Groups/Create.cshtml` - Create new group form
- `Views/Groups/Edit.cshtml` - Edit group form
- `Views/Groups/Details.cshtml` - View group with participants list
- `Views/Groups/_ParticipantForm.cshtml` - Partial for adding participants

**4.4 Participant Management**

- Add actions to GroupsController: AddParticipant, EditParticipant, DeleteParticipant
- Create participant form with name, email, and restrictions selector
- Implement restriction UI (multi-select or checkboxes for other participants)

### Phase 5: Exchange Management

**5.1 Create ExchangesController**

- `Controllers/ExchangesController.cs` with full CRUD
- Actions: Index, Create (from group), Details, Edit, Delete
- Load participants from group with one-click population

**5.2 Create Exchange ViewModels**

- `ViewModels/CreateExchangeViewModel.cs` - Group selection, year, event date
- `ViewModels/ExchangeDetailsViewModel.cs` - Full exchange info with participants
- `ViewModels/ParticipantRestrictionViewModel.cs` - For managing restrictions

**5.3 Create Exchange Views**

- `Views/Exchanges/Index.cshtml` - List all exchanges (organized by year/group)
- `Views/Exchanges/Create.cshtml` - Create exchange form
- `Views/Exchanges/Details.cshtml` - Exchange details with participants and status
- `Views/Exchanges/GenerateMatches.cshtml` - Confirmation page before matching

**5.4 Exchange Status Management**

- Implement status enum: Draft, Active, Completed
- Add status transitions with validation
- Display status badges in UI

### Phase 6: Matching Algorithm Service

**6.1 Create MatchingService Interface**

- `Services/IMatchingService.cs` - Interface with GenerateMatches method
- Method signature: `Task<MatchingResult> GenerateMatchesAsync(Exchange exchange, CancellationToken cancellationToken)`

**6.2 Implement MatchingService**

- `Services/MatchingService.cs` - Core matching logic
- Algorithm approach:

1. Validation phase: Check if matching is possible given constraints
2. Build constraint graph (who can gift whom)
3. Use constraint satisfaction or Fisher-Yates with validation
4. Retry logic with max attempts (default 1000)
5. Handle odd numbers: Suggest organizer exclusion or self-assignment option

- Return `MatchingResult` with success/failure and error messages

**6.3 Matching Algorithm Details**

- Process participants with restrictions first (like old app)
- Track used receivers to prevent duplicates
- Validate no self-assignments
- Validate all restrictions are respected
- If impossible, return clear error message
- Log matching attempts for debugging

**6.4 Integrate with ExchangesController**

- Add `GenerateMatches` action that calls MatchingService
- Save assignments to database
- Update exchange status to Active
- Set MatchedAt timestamp
- Queue email notifications via Hangfire

### Phase 7: Email Service & Notifications

**7.1 Create EmailService Interface**

- `Services/IEmailService.cs` - Interface for email operations
- Methods: SendAssignmentEmailAsync, SendInvitationEmailAsync, SendReminderEmailAsync

**7.2 Implement EmailService**

- `Services/EmailService.cs` using MailKit
- Configure SMTP settings from appsettings.json
- Support SendGrid, Gmail, and custom SMTP
- Implement HTML email templates using Razor
- Create plain text fallback

**7.3 Create Email Templates**

- `Views/Emails/AssignmentEmail.cshtml` - Assignment notification template
- `Views/Emails/InvitationEmail.cshtml` - Account invitation template
- `Views/Emails/ReminderEmail.cshtml` - Event reminder template
- Use RazorEmailTemplates or custom rendering

**7.4 Configure Hangfire**

- Add Hangfire services to `Program.cs`
- Configure Hangfire dashboard (admin only)
- Set up PostgreSQL storage for Hangfire
- Create background job methods for email sending

**7.5 Email Integration**

- After matching, queue emails via Hangfire
- Track email delivery status in Assignment.NotifiedAt
- Implement retry logic for failed emails
- Add email logging

### Phase 8: Assignment Viewing & Privacy

**8.1 Create AssignmentsController**

- `Controllers/AssignmentsController.cs`
- Actions: MyAssignment (user sees only their assignment), ViewAll (organizer sees all)
- Implement strict authorization checks

**8.2 Create Assignment ViewModels**

- `ViewModels/AssignmentViewModel.cs` - User's assignment view
- `ViewModels/AllAssignmentsViewModel.cs` - Organizer's view of all matches

**8.3 Create Assignment Views**

- `Views/Assignments/MyAssignment.cshtml` - Clean, focused assignment view
- `Views/Assignments/ViewAll.cshtml` - Organizer's table of all matches
- Display receiver name, event date, exchange details

**8.4 Dashboard Integration**

- Update `Views/Home/Index.cshtml` to show dashboard after login
- Display: Quick stats, recent exchanges, pending assignments
- Add quick action buttons (Create Group, Start Exchange)

### Phase 9: UI/UX Polish

**9.1 Update Layout & Styling**

- Update `Views/Shared/_Layout.cshtml` with proper navigation
- Add user menu (Profile, Logout) in navbar
- Update Bootstrap to 5.3+ (via CDN or libman)
- Apply custom theme with #DF7861 primary color
- Update `wwwroot/css/site.css` with custom styles

**9.2 Preserve Old Design Elements**

- Copy background image from `old_project/images/background.jpg` to `wwwroot/images/`
- Apply similar styling to landing page
- Maintain color scheme and typography

**9.3 Responsive Design**

- Ensure all forms are mobile-friendly
- Test Bootstrap grid layouts
- Add loading indicators for async operations
- Implement toast notifications for success/error messages

**9.4 Navigation & User Experience**

- Create navigation menu with: Dashboard, My Groups, My Exchanges, My Assignment
- Add breadcrumbs where appropriate
- Implement proper error pages
- Add confirmation dialogs for destructive actions

### Phase 10: Testing & Quality Assurance

**10.1 Unit Tests for MatchingService**

- Create `Tests/ChristmasGiftRandomizer.Tests/` project
- Test scenarios: even numbers, odd numbers, complex restrictions, impossible matches
- Target 100% code coverage for matching logic

**10.2 Unit Tests for EmailService**

- Mock SMTP client
- Test email template rendering
- Verify email content

**10.3 Integration Tests**

- Test user registration and login flow
- Test group creation and participant management
- Test exchange creation and matching
- Test assignment privacy (users can't see others)

**10.4 Manual Testing Checklist**

- All user flows end-to-end
- Edge cases (odd numbers, complex restrictions)
- Email delivery verification
- Mobile responsiveness
- Error handling scenarios

### Phase 11: Documentation & Finalization

**11.1 Code Documentation**

- Add XML comments to public methods
- Document complex algorithms (matching service)
- Add inline comments for non-obvious logic

**11.2 User Documentation**

- Create README.md with setup instructions
- Document database schema
- Provide deployment guide
- Include configuration examples

**11.3 Production Preparation**

- Review security settings (HTTPS, CORS, etc.)
- Set up health checks
- Configure logging for production
- Prepare environment variable documentation

## Key Files to Create/Modify

### New Files (Key Ones)

- `Data/ApplicationDbContext.cs`
- `Models/ApplicationUser.cs`
- `Models/Group.cs`, `Models/Participant.cs`, `Models/Exchange.cs`, etc.
- `Services/IMatchingService.cs`, `Services/MatchingService.cs`
- `Services/IEmailService.cs`, `Services/EmailService.cs`
- `Controllers/AccountController.cs`, `Controllers/GroupsController.cs`, `Controllers/ExchangesController.cs`, `Controllers/AssignmentsController.cs`
- `ViewModels/` - Various view models
- `Views/Emails/` - Email templates

### Files to Modify

- `ChristmasGiftRandomizer.csproj` - Add NuGet packages
- `Program.cs` - Configure services, database, Identity, Hangfire
- `appsettings.json` - Add connection strings and email settings
- `Views/Shared/_Layout.cshtml` - Update navigation and styling
- `Views/Home/Index.cshtml` - Convert to dashboard

## Technical Decisions

1. **Matching Algorithm**: Use constraint-based approach with validation phase before attempting matches. Process restricted participants first, then unrestricted. Max retry limit to prevent infinite loops.

2. **Email Templates**: Use Razor views rendered to strings for HTML emails, with plain text fallback.

3. **Odd Number Handling**: When odd number detected, prompt organizer to either exclude themselves or allow one self-assignment (configurable).

4. **Restrictions Storage**: Use JSON column in PostgreSQL for flexible restriction storage per participant, with separate Restrictions table for exchange-specific overrides.

5. **Background Jobs**: Use Hangfire with PostgreSQL storage for reliable email queue processing.

## Success Criteria

- All 10 phases completed
- Matching algorithm handles all edge cases without infinite loops
- Email notifications sent successfully
- Users can only see their own assignments
- Groups can be saved and reused
- Application is responsive and user-friendly
- All unit tests pass
- Code is well-documented

### To-dos

- [ ] Add required NuGet packages to .csproj (PostgreSQL, Identity, MailKit, Hangfire, Serilog)
- [ ] Configure PostgreSQL connection string and EF Core in Program.cs and appsettings.json
- [ ] Create all entity models (ApplicationUser, Group, Participant, Exchange, Assignment, Restriction, PreviousMatch)
- [ ] Configure ASP.NET Core Identity with ApplicationUser and create AccountController with views
- [ ] Create ApplicationDbContext with all entity configurations and run initial migration
- [ ] Create GroupsController with CRUD operations and participant management
- [ ] Create ExchangesController with exchange management and participant loading from groups
- [ ] Implement MatchingService with robust constraint-based algorithm handling all edge cases
- [ ] Create EmailService with MailKit, Razor email templates, and Hangfire integration
- [ ] Create AssignmentsController with privacy enforcement (users see only their assignment)
- [ ] Update UI with Bootstrap 5.3+, custom theme (#DF7861), responsive design, and dashboard
- [ ] Write unit tests for MatchingService and EmailService, integration tests for controllers