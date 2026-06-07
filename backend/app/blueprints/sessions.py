import calendar as cal
from datetime import datetime

from flask import Blueprint, g, jsonify, request

from app.extensions import supabase
from app.middleware.auth import require_auth, require_role

sessions_bp = Blueprint('sessions', __name__)


def _get_user_record(user_id):
    result = supabase.table('users').select('*').eq('id', user_id).execute()
    if not result.data:
        return None
    return result.data[0]


def _accessible_class_ids(user):
    role = user['role']
    if role == 'teacher':
        result = supabase.table('class_groups').select('id').eq(
            'teacher_id', user['id']
        ).execute()
        return [row['id'] for row in result.data or []]
    if role == 'student':
        result = supabase.table('class_enrollments').select('class_id').eq(
            'student_id', user['id']
        ).execute()
        return [row['class_id'] for row in result.data or []]
    return None


def _class_map(class_ids):
    if not class_ids:
        return {}
    result = supabase.table('class_groups').select(
        'id, name, color'
    ).in_('id', class_ids).execute()
    return {row['id']: row for row in result.data or []}


def _serialize_session(row, classes_by_id):
    class_info = classes_by_id.get(row['class_id'], {})
    return {
        'id': row['id'],
        'class_id': row['class_id'],
        'class_name': class_info.get('name', ''),
        'color': class_info.get('color', '#6366f1'),
        'title': row['title'],
        'date': row['date'],
        'start_time': row['start_time'],
        'end_time': row['end_time'],
        'location': row.get('location') or '',
        'type': row['type'],
        'created_at': row.get('created_at'),
    }


def _parse_month(month_str):
    try:
        parsed = datetime.strptime(month_str, '%Y-%m')
        last_day = cal.monthrange(parsed.year, parsed.month)[1]
        start = parsed.strftime('%Y-%m-01')
        end = parsed.strftime(f'%Y-%m-{last_day:02d}')
        return start, end
    except ValueError:
        return None, None


def _teacher_owns_class(class_id, teacher_id):
    result = supabase.table('class_groups').select('id').eq(
        'id', class_id
    ).eq('teacher_id', teacher_id).execute()
    return bool(result.data)


@sessions_bp.route('/api/sessions', methods=['GET'])
@require_auth
def list_sessions():
    user = _get_user_record(g.current_user.id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    class_ids = _accessible_class_ids(user)
    if class_ids is None:
        return jsonify({'error': 'Forbidden'}), 403
    if not class_ids:
        return jsonify({'sessions': []}), 200

    month = request.args.get('month', '').strip()
    class_id = request.args.get('class_id', '').strip()

    try:
        query = supabase.table('sessions').select('*').in_('class_id', class_ids)

        if class_id:
            if class_id not in class_ids:
                return jsonify({'error': 'Forbidden'}), 403
            query = query.eq('class_id', class_id)

        if month:
            start, end = _parse_month(month)
            if not start:
                return jsonify({'error': 'month must be YYYY-MM'}), 400
            query = query.gte('date', start).lte('date', end)

        result = query.order('date').order('start_time').execute()
    except Exception:
        return jsonify({'error': 'Failed to load sessions'}), 500

    rows = result.data or []
    classes_by_id = _class_map(class_ids)

    return jsonify({
        'sessions': [
            _serialize_session(row, classes_by_id)
            for row in rows
        ]
    }), 200


@sessions_bp.route('/api/sessions', methods=['POST'])
@require_role('teacher')
def create_session():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    class_id = data.get('class_id')
    title = (data.get('title') or '').strip()
    date = (data.get('date') or '').strip()
    start_time = (data.get('start_time') or '').strip()
    end_time = (data.get('end_time') or '').strip()
    location = (data.get('location') or '').strip()
    session_type = data.get('type', 'one-time')

    if not class_id or not title or not date or not start_time or not end_time:
        return jsonify({
            'error': 'class_id, title, date, start_time, and end_time are required'
        }), 400

    if session_type != 'one-time':
        return jsonify({'error': 'Only one-time sessions are supported in MVP'}), 400

    try:
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'date must be YYYY-MM-DD'}), 400

    for time_value, label in ((start_time, 'start_time'), (end_time, 'end_time')):
        try:
            datetime.strptime(time_value, '%H:%M')
        except ValueError:
            try:
                datetime.strptime(time_value, '%H:%M:%S')
            except ValueError:
                return jsonify({'error': f'{label} must be HH:MM or HH:MM:SS'}), 400

    if not _teacher_owns_class(class_id, g.current_user.id):
        return jsonify({'error': 'Class not found'}), 404

    payload = {
        'class_id': class_id,
        'title': title,
        'date': date,
        'start_time': start_time,
        'end_time': end_time,
        'location': location or None,
        'type': 'one-time',
    }

    try:
        result = supabase.table('sessions').insert(payload).execute()
    except Exception:
        return jsonify({'error': 'Failed to create session'}), 500

    if not result.data:
        return jsonify({'error': 'Failed to create session'}), 500

    classes_by_id = _class_map([class_id])
    return jsonify({
        'session': _serialize_session(result.data[0], classes_by_id),
    }), 201
