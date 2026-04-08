<?php

namespace App\Enums;


enum UserRole: string
{
    case ADMIN = 'admin';
    case EMPLOYEE = 'employee';
    case MODERATOR = 'moderator';


    public function label() :string {
        return match ($this) {
            self::ADMIN => 'Administrator',
            self::MODERATOR => 'Moderator',
            self::EMPLOYEE => 'Employee',
        };
    }
}
