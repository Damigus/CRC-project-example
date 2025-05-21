import json

from datetime import datetime
from .utils import write_to_json_file


def ban_member(member_data):
    filename = 'app/archive/banned_users.json'
    member_data["banned_at"] = datetime.now().isoformat()
    write_to_json_file(filename, member_data)


def delete_member(member_data):
    filename = 'app/archive/deleted_users.json'
    member_data["deleted_at"] = datetime.now().isoformat()
    write_to_json_file(filename, member_data)


def unban_member(id):
    filename = 'app/archive/banned_users.json'
    with open(filename, 'r', encoding='utf-8') as banned_members:
        data = json.load(banned_members)

    unbanned = None
    updated_data = []

    for member in data:
        if member['id'] == id:
            unbanned = member
        else:
            updated_data.append(member)
    if unbanned:
        with open(filename, 'w', encoding='utf-8') as new_f:
            json.dump(updated_data, new_f, indent=4)
        return unbanned
