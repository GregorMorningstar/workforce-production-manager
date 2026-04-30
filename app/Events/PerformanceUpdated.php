<?php

namespace App\Events;

use App\Models\ProductionPerformance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PerformanceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ProductionPerformance $performance)
    {
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('performance.moderator'),
        ];

        if ($this->performance->user_id) {
            $channels[] = new PrivateChannel('performance.user.' . $this->performance->user_id);
        }

        if ($this->performance->department_id) {
            $channels[] = new PrivateChannel('performance.department.' . $this->performance->department_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'PerformanceUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->performance->id,
            'user_id' => $this->performance->user_id,
            'department_id' => $this->performance->department_id,
            'machine_id' => $this->performance->machine_id,
            'norm_performance_percent' => $this->performance->norm_performance_percent,
            'norm_usage_percent' => $this->performance->norm_usage_percent,
            'actual_task_seconds' => $this->performance->actual_task_seconds,
            'norm_required_seconds' => $this->performance->norm_required_seconds,
            'completed_cycles' => $this->performance->completed_cycles,
            'required_cycles' => $this->performance->required_cycles,
            'occurred_at' => optional($this->performance->occurred_at)->toDateTimeString(),
        ];
    }
}
