import { useState } from 'react';
import { Image, Text, View } from 'react-native';

export default function ReportAuthorAvatar({ author, style, textStyle }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const profilePhotoUrl = author?.profile_photo_url;

  if (profilePhotoUrl && failedUrl !== profilePhotoUrl) {
    return (
      <Image
        source={{ uri: profilePhotoUrl }}
        style={style}
        resizeMode="cover"
        accessibilityLabel={`${author?.name || 'Report author'} profile photo`}
        onError={() => setFailedUrl(profilePhotoUrl)}
      />
    );
  }

  return (
    <View style={style}>
      <Text style={textStyle}>{author?.initial || 'C'}</Text>
    </View>
  );
}
