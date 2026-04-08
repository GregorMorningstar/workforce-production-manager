<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Enums\OrderStatus;
use App\Enums\OrderItemProductionPlanStatus;
use App\Models\Machines;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemProductionPlan;
use App\Models\ProductionSchemaStep;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Repositories\Contracts\ProductionSchemaRepositoryInterface;
use App\Services\Contracts\OrderServiceInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductionPlanController extends Controller
{

     public function __construct(
          private readonly ProductionSchemaRepositoryInterface $schemaRepo,
          private readonly OrderServiceInterface $orderService,
     )
     {
     }

     public function index(Request $request)
     {
          // Load production schemas via repository with pagination
          $schemas = $this->schemaRepo->paginate(10);
          $schemas->appends($request->query());

          $ordersForPlanning = Order::query()
               ->withCount('items')
               ->where('status', OrderStatus::ACCEPTED->value)
               ->orderByDesc('id')
               ->paginate(50, ['*'], 'orders_page');
          $ordersForPlanning->appends($request->query());

          $ordersInProgress = Order::query()
               ->withCount('items')
               ->where('status', OrderStatus::IN_PROGRESS->value)
               ->orderByDesc('id')
               ->paginate(50, ['*'], 'in_progress_page');
          $ordersInProgress->appends($request->query());

          return Inertia::render('moderator/production-planning/element/index', [
               'schemas' => $schemas,
               'ordersForPlanning' => $ordersForPlanning,
               'ordersInProgress' => $ordersInProgress,
          ]);
     }

     public function processes(Request $request)
     {
          return Inertia::render('moderator/production-planning/processes/index');
     }

     public function orderSchema(int $orderId)
     {
          $order = $this->orderService->find($orderId);
          if (!$order) {
               abort(404, 'Zamówienie nie znalezione');
          }

          $items = $order->items()->with('product')->get();

          $orderItemsWithSchema = $items->map(function ($item) {
               $schema = $this->schemaRepo->findByItem((int) $item->items_finished_good_id);

               $steps = collect($schema?->steps ?? [])->map(function ($step) use ($item) {
                    // Fallback logic for material and quantity
                    $material = $step->material;
                    $quantity = $step->required_quantity;
                    $unit = $step->unit;

                    // Try to get from operation.productionMaterial
                    if (!$material && $step->operation?->productionMaterial) {
                        $material = $step->operation->productionMaterial;
                    }
                    // Try to get from operation.materials (pivot)
                    if (!$material && $step->operation?->materials?->isNotEmpty()) {
                        $material = $step->operation->materials->first();
                    }
                    if ($quantity === null && $step->operation?->materials?->isNotEmpty()) {
                        $quantity = $step->operation->materials->first()?->pivot?->quantity;
                    }
                    if (empty($unit) && $step->operation?->materials?->isNotEmpty()) {
                        $unit = $step->operation->materials->first()?->pivot?->unit;
                    }

                    return [
                        'id' => $step->id,
                        'step_number' => $step->step_number,
                        'operation_name' => $step->operation?->operation_name,
                        'machine_id' => $step->machine_id,
                        'machine_name' => $step->machine?->name,
                        'material_name' => $material?->name,
                        'required_quantity' => $quantity,
                        'production_time_seconds' => (int) ($step->production_time_seconds ?? 0),
                        'unit' => $unit,
                    ];
               })->values();

               return [
                    'order_item_id' => $item->id,
                    'model_name' => $item->product?->name,
                    'quantity' => (int) $item->quantity,
                    'schema_name' => $schema?->name,
                    'steps' => $steps,
               ];
          })->values();

          $employees = User::query()
               ->where('role', UserRole::EMPLOYEE->value)
               ->orderBy('name')
               ->get(['id', 'name', 'machine_id']);

          $existingPlans = OrderItemProductionPlan::query()
               ->where('order_id', $order->id)
               ->get([
                    'order_item_id',
                    'production_schema_step_id',
                    'assigned_user_id',
                    'planned_start_at',
                    'planned_end_at',
                    'order_quantity',
               ])
               ->keyBy(function ($plan) {
                    return $plan->order_item_id . '-' . $plan->production_schema_step_id;
               });

          $orderItemsWithSchema = $orderItemsWithSchema->map(function ($item) use ($existingPlans) {
               $item['steps'] = collect($item['steps'])->map(function ($step) use ($existingPlans, $item) {
                    $key = $item['order_item_id'] . '-' . $step['id'];

                    $plan = $existingPlans[$key] ?? null;
                    $step['assigned_user_id'] = $plan?->assigned_user_id;

                    $baseTotalSeconds = (int) ($step['production_time_seconds'] ?? 0) * (int) $item['quantity'];
                    $savedTotalSeconds = null;

                    if ($plan?->planned_start_at && $plan?->planned_end_at) {
                         $savedTotalSeconds = Carbon::parse($plan->planned_start_at)
                              ->diffInSeconds(Carbon::parse($plan->planned_end_at));
                    }

                    $effectiveSeconds = $savedTotalSeconds ?? $baseTotalSeconds;
                    $step['total_time_seconds'] = $effectiveSeconds;
                    $step['changeover_applied'] = $savedTotalSeconds !== null
                         ? $savedTotalSeconds > $baseTotalSeconds
                         : false;

                    return $step;
               })->values();

               return $item;
          })->values();

          return Inertia::render('moderator/production-planning/processes/order-schema', [
               'order' => [
                    'id' => $order->id,
                    'barcode' => $order->barcode,
                    'customer_name' => $order->customer_name,
                    'planned_production_at' => $order->planned_production_at,
                    'finished_at' => $order->finished_at,
               ],
               'orderItems' => $orderItemsWithSchema,
               'employees' => $employees,
          ]);
     }

     public function assignOperators(Request $request, int $orderId)
     {
          $order = $this->orderService->find($orderId);
          if (!$order) {
               abort(404, 'Zamówienie nie znalezione');
          }

          $validated = $request->validate([
               'assignments' => ['required', 'array'],
               'assignments.*.order_item_id' => ['required', 'integer', 'exists:order_items,id'],
               'assignments.*.step_id' => ['required', 'integer', 'exists:production_schema_steps,id'],
               'assignments.*.machine_id' => ['nullable', 'integer', 'exists:machines,id'],
               'assignments.*.user_id' => ['nullable', 'integer', 'exists:users,id'],
          ]);

          $plannedStart = $order->planned_production_at
               ? Carbon::parse($order->planned_production_at)
               : now();

          DB::transaction(function () use ($validated, $order, $plannedStart) {
               $allSteps = [];
               $assignedSteps = [];
               foreach ($validated['assignments'] as $assignment) {
                    $orderItemId = (int) $assignment['order_item_id'];
                    $stepId = (int) $assignment['step_id'];
                    $machineId = $assignment['machine_id'] ?? null;
                    $userId = $assignment['user_id'] ?? null;

                    $orderItem = OrderItem::query()
                         ->where('id', $orderItemId)
                         ->where('order_id', $order->id)
                         ->first();
                    if (!$orderItem) {
                         continue;
                    }
                    $step = ProductionSchemaStep::query()->find($stepId);
                    if (!$step) {
                         continue;
                    }
                    $allSteps[] = $orderItem->id . '-' . $step->id;

                    $assignedUserId = null;
                    if ($userId) {
                         $employee = User::query()
                              ->where('id', $userId)
                              ->where('role', UserRole::EMPLOYEE->value)
                              ->first();

                         if ($employee) {
                              $assignedUserId = $employee->id;
                         }
                    }

                    $requiredPerUnit = (float) ($step->required_quantity ?? 0);
                    $requiredTotal = $requiredPerUnit * (int) $orderItem->quantity;
                    $plannedEnd = null;

                    if (!$assignedUserId) {
                         OrderItemProductionPlan::query()
                              ->where('order_item_id', $orderItem->id)
                              ->where('production_schema_step_id', $step->id)
                              ->delete();
                         continue;
                    } else {
                         $assignedSteps[] = $orderItem->id . '-' . $step->id;
                    }

                    $effectiveMachineId = $machineId ?? $step->machine_id;
                    $machine = null;
                    $changeoverSeconds = 0;

                    if ($effectiveMachineId) {
                         $machine = Machines::query()->find($effectiveMachineId);

                         $isSameOperation = $machine
                              && (int) $machine->last_operationmachine_id === (int) $step->operationmachine_id;

                         $isSameProduct = $machine
                              && (int) $machine->last_items_finished_good_id === (int) $orderItem->items_finished_good_id;

                         if (!$isSameOperation || !$isSameProduct) {
                              $changeoverRaw = (float) ($step->operation?->changeover_time ?? 0);
                              // changeover_time is stored in minutes
                              $changeoverSeconds = (int) round($changeoverRaw * 60);
                         }
                    }

                    $baseStepSeconds = (int) ($step->production_time_seconds ?? 0);
                    $totalStepSeconds = ($baseStepSeconds * (int) $orderItem->quantity) + $changeoverSeconds;

                    if ($totalStepSeconds > 0) {
                         $plannedEnd = (clone $plannedStart)->addSeconds($totalStepSeconds);
                    }

                    OrderItemProductionPlan::query()->updateOrCreate(
                         [
                              'order_item_id' => $orderItem->id,
                              'production_schema_step_id' => $step->id,
                         ],
                         [
                              'order_id' => $order->id,
                              'items_finished_good_id' => $orderItem->items_finished_good_id,
                              'production_schema_id' => $step->production_schema_id,
                              'machine_id' => $effectiveMachineId,
                              'operationmachine_id' => $step->operationmachine_id,
                              'production_material_id' => $step->production_material_id,
                              'assigned_user_id' => $assignedUserId,
                              'planned_start_at' => $plannedStart,
                              'planned_end_at' => $plannedEnd,
                              'order_quantity' => (int) $orderItem->quantity,
                              'required_quantity_per_unit' => $requiredPerUnit,
                              'required_total_quantity' => $requiredTotal,
                              'unit' => $step->unit,
                              'status' => OrderItemProductionPlanStatus::DODANO_PRACOWNIKA->value,
                         ]
                    );

                    if ($machine) {
                         $machine->update([
                              'last_operationmachine_id' => $step->operationmachine_id,
                              'last_items_finished_good_id' => $orderItem->items_finished_good_id,
                         ]);
                    }
               }
               // Po przypisaniu wszystkich pracowników do wszystkich kroków, ustaw status zamówienia na IN_PROGRESS
               $allUniqueSteps = array_values(array_unique($allSteps));
               $assignedUniqueSteps = array_values(array_unique($assignedSteps));

               if (count($allUniqueSteps) > 0 && count($allUniqueSteps) === count($assignedUniqueSteps)) {
                    $order->status = \App\Enums\OrderStatus::IN_PROGRESS->value;
                    $order->save();
               }
          });

          $summary = OrderItemProductionPlan::query()
               ->with('assignedUser:id,name')
               ->where('order_id', $order->id)
               ->whereNotNull('assigned_user_id')
               ->get()
               ->groupBy('assigned_user_id')
               ->map(function ($plans) {
                    $first = $plans->first();

                    return [
                         'user_id' => (int) $first->assigned_user_id,
                         'user_name' => $first->assignedUser?->name ?? 'Nieznany pracownik',
                         'steps_count' => $plans->count(),
                         'items_count' => $plans->pluck('order_item_id')->unique()->count(),
                    ];
               })
               ->sortBy('user_name')
               ->values()
               ->all();

          return redirect()->back()
               ->with('success', 'Plan produkcji został zapisany (osoby + daty + kroki).')
               ->with('assignment_summary', $summary);
     }
}
