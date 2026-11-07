# CAVE

CAVE (Clean Architecture Visualizer) shows how a Java project built with Clean Architecture
fits together, for students in CSC207 Software Design. Its domain vocabulary is Clean
Architecture's own.

## Language

### The tool

**CAVE**:
The `cave` command-line tool and web app in this repo, which read a Java project and draw its
CA Engine diagrams.
_Avoid_: CAV, the visualizer

**CA Engine**:
The object diagram of one use case's path: View, Controller, Interactor, Data Access,
Presenter, View Model, and back to the View.
_Avoid_: CA diagram, flow diagram

### Clean Architecture layers

**Entity**:
A business data structure named after a problem-domain concept, built by Data Access objects
from persistent data.
_Avoid_: model, domain object

**Interface Adapter**:
An object that translates between the View and the Interactors: a Controller, Presenter, or
View Model.
_Avoid_: glue code, middleware

**Use case layer**:
The Clean Architecture layer that holds Interactors, their Input and Output Boundaries, Input
and Output Data, and Data Access Interfaces; it holds part of every use case, not whole use
cases.
_Avoid_: application layer

**Frameworks & Drivers**:
The View and the Data Access objects: the parts that represent technology choices, isolated
from the business logic.
_Avoid_: infrastructure

### One use case

**User interaction**:
Something a user does in the analysed program, such as clicking "Transfer"; one use case
handles it.
_Avoid_: action, event

**Use case**:
The set of classes that handle one user interaction: its Controller, Input Boundary, Input
Data, Interactor, Output Boundary, Output Data, and Presenter.
_Avoid_: interaction (in code)

**Interactor**:
The business-logic object of a single use case, depending only on Entities and the
interfaces it declares.
_Avoid_: service, handler, use case (for the object)

**Input Boundary**:
The interface, usually one method, that a Controller calls to invoke an Interactor.

**Output Boundary**:
The interface, usually one method, that a Presenter implements and an Interactor calls.

**Input Data**:
The raw-data object a Controller passes across the Input Boundary.
_Avoid_: request model, DTO

**Output Data**:
The raw-data object an Interactor passes across the Output Boundary; it never contains
Entities.
_Avoid_: response model, DTO

**Data Access Interface**:
An interface an Interactor declares for the CRUD operations it needs; Data Access objects
implement it.
_Avoid_: repository

**Controller**:
The Interface Adapter that wraps raw View data in an Input Data object and invokes an
Interactor.

**Presenter**:
The Interface Adapter that turns Output Data into View Model changes.

**View Model**:
The data one screen, or part of one, needs to display; the View observes it.
_Avoid_: state, store

**Composition root**:
The one place that builds the CA Engine with dependency injection, then gets out of the way.
_Avoid_: main (for the role)

**Design pattern**:
A reusable design solution that CAVE can identify in a Java codebase. To add one,
follow the developer guide's [new pattern instructions](docs/developers/Patterns.md#adding-a-new-pattern),
including the JSON definition, pattern enums, concrete entity, and factory registration.
